import React, { useState, useEffect, useCallback } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import { User, Expense, Category, Role, Status, Subcategory, AuditLogItem, Project, Site, AvailableBackups } from './types';
import * as Notifications from './notifications';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import SupabaseInstructions from './components/SupabaseInstructions';
import { Session } from '@supabase/supabase-js';

const generateReferenceNumber = (): string => {
    const date = new Date();
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `EXP-${year}${month}${day}-${randomSuffix}`;
};

const mapDbUserToAppUser = (dbProfile: any): User => ({
  id: dbProfile.id,
  username: dbProfile.username,
  name: dbProfile.name,
  email: dbProfile.email,
  role: dbProfile.role as Role,
});

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [auditLog, setAuditLog] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!session) return;
    setLoading(true);

    try {
      const [
        usersRes,
        categoriesRes,
        projectsRes,
        sitesRes,
        expensesRes,
        auditLogRes,
      ] = await Promise.all([
        supabase.from('profiles').select('*'),
        supabase.from('categories').select('*, subcategories(*)'),
        supabase.from('projects').select('*'),
        supabase.from('sites').select('*'),
        supabase.from('expenses').select('*, profiles!requestor_id(name)').order('submitted_at', { ascending: false }),
        supabase.from('audit_log').select('*').order('timestamp', { ascending: false }),
      ]);
      
      if (usersRes.error) throw usersRes.error;
      setUsers(usersRes.data.map(mapDbUserToAppUser));

      if (categoriesRes.error) throw categoriesRes.error;
      const fetchedCategories = categoriesRes.data.map(c => ({
        id: c.id,
        name: c.name,
        attachmentRequired: c.attachment_required,
        autoApproveAmount: c.auto_approve_amount,
        subcategories: (c.subcategories as any[]).map(sc => ({
          id: sc.id,
          name: sc.name,
          attachmentRequired: sc.attachment_required
        }))
      }));
      setCategories(fetchedCategories);

      if (projectsRes.error) throw projectsRes.error;
      setProjects(projectsRes.data);

      if (sitesRes.error) throw sitesRes.error;
      setSites(sitesRes.data);

      if (expensesRes.error) throw expensesRes.error;
      const fetchedExpenses = expensesRes.data.map((e: any) => ({
        ...e,
        requestorName: e.profiles.name,
      }));
      setExpenses(fetchedExpenses);

      if (auditLogRes.error) throw auditLogRes.error;
      setAuditLog(auditLogRes.data.map((log: any) => ({
        ...log,
        actorId: log.actor_id,
        actorName: log.actor_name
      })));

    } catch (error) {
      console.error("Error fetching data:", error);
      alert("Could not fetch data from the server.");
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (!isSupabaseConfigured) {
        setLoading(false);
        return;
    }
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) {
        return;
    }
    const fetchUserProfile = async () => {
      if (session) {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        if (error) {
          console.error('Error fetching user profile:', error);
          // Might need to sign out if profile doesn't exist
        } else if (data) {
          setCurrentUser(mapDbUserToAppUser(data));
        }
      } else {
        setCurrentUser(null);
      }
    };
    fetchUserProfile();
    if(session) {
        fetchData();
    }
  }, [session, fetchData]);

  const addAuditLogEntry = async (action: string, details: string) => {
    if (!currentUser) return;
    const { error } = await supabase.from('audit_log').insert({
      actor_id: currentUser.id,
      actor_name: currentUser.name,
      action,
      details,
    });
    if (error) console.error("Failed to add audit log:", error);
    else await fetchData(); // refetch to update log
  };

  const handleAddExpense = async (expenseData: Omit<Expense, 'id' | 'status' | 'submittedAt' | 'history' | 'requestorId' | 'requestorName' | 'referenceNumber' | 'attachment_path' | 'subcategory_attachment_path'> & { attachment?: File, subcategoryAttachment?: File }) => {
    if (!currentUser) return;

    let attachment_path: string | null = null;
    if (expenseData.attachment) {
        const file = expenseData.attachment;
        const filePath = `${currentUser.id}/${Date.now()}_${file.name}`;
        const { error } = await supabase.storage.from('attachments').upload(filePath, file);
        if (error) {
            alert('Failed to upload attachment.');
            console.error(error);
            return;
        }
        attachment_path = filePath;
    }

    let subcategory_attachment_path: string | null = null;
    if (expenseData.subcategoryAttachment) {
        const file = expenseData.subcategoryAttachment;
        const filePath = `${currentUser.id}/${Date.now()}_sub_${file.name}`;
        const { error } = await supabase.storage.from('attachments').upload(filePath, file);
        if (error) {
            alert('Failed to upload subcategory attachment.');
            console.error(error);
            return;
        }
        subcategory_attachment_path = filePath;
    }

    const newExpense: Omit<Expense, 'id' | 'requestorName'> = {
      ...expenseData,
      referenceNumber: generateReferenceNumber(),
      requestorId: currentUser.id,
      submittedAt: new Date().toISOString(),
      status: Status.PENDING_VERIFICATION,
      isHighPriority: false,
      history: [{
        actorId: currentUser.id,
        actorName: currentUser.name,
        action: 'Submitted',
        timestamp: new Date().toISOString(),
      }],
      attachment_path,
      subcategory_attachment_path,
    };

    const category = categories.find(c => c.id === newExpense.categoryId);
    if (category && newExpense.amount <= category.autoApproveAmount) {
      newExpense.status = Status.APPROVED;
      newExpense.history.push({
        actorId: 'system',
        actorName: 'System',
        action: 'Auto-Approved',
        timestamp: new Date().toISOString(),
        comment: `Amount is within auto-approval limit of ₹${category.autoApproveAmount.toLocaleString('en-IN')}.`
      });
    }

    const { error: insertError } = await supabase.from('expenses').insert({
        ...newExpense,
        // map App type to DB schema
        reference_number: newExpense.referenceNumber,
        requestor_id: newExpense.requestorId,
        category_id: newExpense.categoryId,
        subcategory_id: newExpense.subcategoryId,
        project_id: newExpense.projectId,
        site_id: newExpense.siteId,
        submitted_at: newExpense.submittedAt,
        is_high_priority: newExpense.isHighPriority,
        attachment_path: newExpense.attachment_path,
        subcategory_attachment_path: newExpense.subcategory_attachment_path,
    });

    if (insertError) {
        alert("Failed to create expense.");
        console.error(insertError);
        return;
    }

    await fetchData();

    // Notifications can stay as they are (console logs)
    const projectName = projects.find(p => p.id === newExpense.projectId)?.name || 'N/A';
    const siteName = sites.find(s => s.id === newExpense.siteId)?.name || 'N/A';
    const subcategory = category?.subcategories?.find(sc => sc.id === newExpense.subcategoryId);
    if (category) {
        Notifications.notifyRequestorOnSubmission(currentUser, newExpense as Expense, category.name, subcategory?.name, projectName, siteName);
        if (newExpense.status === Status.PENDING_VERIFICATION) {
            const verifiers = users.filter(u => u.role === Role.VERIFIER);
            Notifications.notifyVerifiersOnSubmission(verifiers, newExpense as Expense, category.name, subcategory?.name, projectName, siteName);
        }
    }
  };

  const handleUpdateExpenseStatus = async (expenseId: string, newStatus: Status, comment?: string) => {
    if (!currentUser) return;
    
    const expenseToUpdate = expenses.find(e => e.id === expenseId);
    if (!expenseToUpdate) return;
    
    let action = '';
    if (newStatus === Status.PENDING_APPROVAL) action = 'Verified';
    else if (newStatus === Status.APPROVED) action = 'Approved';
    else if (newStatus === Status.REJECTED) action = 'Rejected';

    const newHistoryItem = {
        actorId: currentUser.id,
        actorName: currentUser.name,
        action,
        timestamp: new Date().toISOString(),
        comment
    };
    
    const updatedHistory = [...expenseToUpdate.history, newHistoryItem];

    const { error } = await supabase.from('expenses').update({ status: newStatus, history: updatedHistory }).eq('id', expenseId);

    if (error) {
      alert("Failed to update status.");
      console.error(error);
      return;
    }

    const updatedExpense = { ...expenseToUpdate, status: newStatus, history: updatedHistory };
    setExpenses(prev => prev.map(e => e.id === expenseId ? updatedExpense : e));

    // Notifications
    const requestor = users.find(u => u.id === expenseToUpdate.requestorId);
    const category = categories.find(c => c.id === expenseToUpdate.categoryId);
    const subcategory = category?.subcategories?.find(sc => sc.id === expenseToUpdate.subcategoryId);
    const projectName = projects.find(p => p.id === expenseToUpdate.projectId)?.name || 'N/A';
    const siteName = sites.find(s => s.id === expenseToUpdate.siteId)?.name || 'N/A';

    if (requestor && category) {
        Notifications.notifyOnStatusChange(requestor, updatedExpense, category.name, subcategory?.name, projectName, siteName, comment);
        if (expenseToUpdate.status === Status.PENDING_VERIFICATION && newStatus === Status.PENDING_APPROVAL) {
            const approvers = users.filter(u => u.role === Role.APPROVER);
            Notifications.notifyApproversOnVerification(approvers, updatedExpense, category.name, subcategory?.name, projectName, siteName);
        }
    }
  };

   const handleBulkUpdateExpenseStatus = async (expenseIds: string[], newStatus: Status, comment?: string) => {
    for (const id of expenseIds) {
        // This is inefficient but simple. For production, a stored procedure would be better.
        await handleUpdateExpenseStatus(id, newStatus, comment);
    }
    let actionVerb = '';
    if (newStatus === Status.PENDING_APPROVAL) actionVerb = 'Verified';
    else if (newStatus === Status.APPROVED) actionVerb = 'Approved';
    else if (newStatus === Status.REJECTED) actionVerb = 'Rejected';
    addAuditLogEntry('Bulk Expense Update', `Bulk action: ${actionVerb} ${expenseIds.length} expense(s).`);
  };

  const handleUpdateUser = async (updatedUser: User) => {
    const { error } = await supabase.from('profiles').update({ 
      name: updatedUser.name,
      username: updatedUser.username,
      role: updatedUser.role,
      email: updatedUser.email
    }).eq('id', updatedUser.id);
    if(error) console.error(error);
    else {
      addAuditLogEntry('User Updated', `Updated profile for user '${updatedUser.username}'.`);
      await fetchData();
    }
  };
  
  const onDeleteUser = async (userId: string) => {
     alert("User deletion is an administrative action that should be handled in the Supabase dashboard for security reasons (e.g., to properly handle related data).");
  };
  
  const onCrudOperation = async (operation: Promise<any>, successMessage: string, errorMessage: string) => {
    const { error } = await operation;
    if (error) {
      console.error(errorMessage, error);
      alert(`${errorMessage}: ${error.message}`);
    } else {
      addAuditLogEntry('Configuration Change', successMessage);
      await fetchData();
    }
  };

  const handleAddCategory = (d: Omit<Category, 'id'>) => onCrudOperation(supabase.from('categories').insert({name: d.name, attachment_required: d.attachmentRequired, auto_approve_amount: d.autoApproveAmount}), `Created category '${d.name}'.`, 'Failed to create category.');
  const handleUpdateCategory = (d: Category) => onCrudOperation(supabase.from('categories').update({name: d.name, attachment_required: d.attachmentRequired, auto_approve_amount: d.autoApproveAmount}).eq('id', d.id), `Updated category '${d.name}'.`, 'Failed to update category.');
  const onDeleteCategory = (id: string) => onCrudOperation(supabase.from('categories').delete().eq('id', id), `Deleted category.`, 'Failed to delete category.');
  
  const handleAddSubcategory = (catId: string, d: Omit<Subcategory, 'id'>) => onCrudOperation(supabase.from('subcategories').insert({category_id: catId, name: d.name, attachment_required: d.attachmentRequired}), `Created subcategory '${d.name}'.`, 'Failed to create subcategory.');
  const handleUpdateSubcategory = (catId: string, d: Subcategory) => onCrudOperation(supabase.from('subcategories').update({name: d.name, attachment_required: d.attachmentRequired}).eq('id', d.id), `Updated subcategory '${d.name}'.`, 'Failed to update subcategory.');
  const onDeleteSubcategory = (catId: string, id: string) => onCrudOperation(supabase.from('subcategories').delete().eq('id', id), `Deleted subcategory.`, 'Failed to delete subcategory.');
  
  const handleAddProject = (d: Omit<Project, 'id'>) => onCrudOperation(supabase.from('projects').insert(d), `Created project '${d.name}'.`, 'Failed to create project.');
  const handleUpdateProject = (d: Project) => onCrudOperation(supabase.from('projects').update({name: d.name}).eq('id', d.id), `Updated project '${d.name}'.`, 'Failed to update project.');
  const onDeleteProject = (id: string) => onCrudOperation(supabase.from('projects').delete().eq('id', id), `Deleted project.`, 'Failed to delete project.');
  
  const handleAddSite = (d: Omit<Site, 'id'>) => onCrudOperation(supabase.from('sites').insert(d), `Created site '${d.name}'.`, 'Failed to create site.');
  const handleUpdateSite = (d: Site) => onCrudOperation(supabase.from('sites').update({name: d.name}).eq('id', d.id), `Updated site '${d.name}'.`, 'Failed to update site.');
  const onDeleteSite = (id: string) => onCrudOperation(supabase.from('sites').delete().eq('id', id), `Deleted site.`, 'Failed to delete site.');

  const handleToggleExpensePriority = async (expenseId: string) => {
    const expenseToUpdate = expenses.find(e => e.id === expenseId);
    if (!expenseToUpdate) return;
    const newPriority = !expenseToUpdate.isHighPriority;
    const { error } = await supabase.from('expenses').update({ is_high_priority: newPriority }).eq('id', expenseId);
    if(error) console.error(error);
    else {
      const action = newPriority ? 'Marked as High Priority' : 'Removed High Priority';
      addAuditLogEntry('Expense Priority Changed', `${action} for expense '${expenseToUpdate.referenceNumber}'.`);
      await fetchData();
    }
  };

  if (!isSupabaseConfigured) {
    return <SupabaseInstructions />;
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!session || !currentUser) {
    return <Login />;
  }
  
  // Note: All backup related functionality has been removed in favor of Supabase's built-in platform features.
  // The props related to backups are removed from Dashboard.

  return (
    <Dashboard
      currentUser={currentUser}
      users={users}
      categories={categories}
      projects={projects}
      sites={sites}
      expenses={expenses}
      auditLog={auditLog}
      onLogout={() => supabase.auth.signOut()}
      onAddExpense={handleAddExpense as any}
      onUpdateExpenseStatus={handleUpdateExpenseStatus}
      onBulkUpdateExpenseStatus={handleBulkUpdateExpenseStatus}
      onAddUser={() => alert("Users must sign up themselves.")}
      onUpdateUser={handleUpdateUser}
      onDeleteUser={onDeleteUser}
      onAddCategory={handleAddCategory}
      onUpdateCategory={handleUpdateCategory}
      onDeleteCategory={onDeleteCategory}
      onAddSubcategory={handleAddSubcategory}
      onUpdateSubcategory={handleUpdateSubcategory}
      onDeleteSubcategory={onDeleteSubcategory}
      onToggleExpensePriority={handleToggleExpensePriority}
      onAddProject={handleAddProject}
      onUpdateProject={handleUpdateProject}
      onDeleteProject={onDeleteProject}
      onAddSite={handleAddSite}
      onUpdateSite={handleUpdateSite}
      onDeleteSite={onDeleteSite}
    />
  );
};

export default App;