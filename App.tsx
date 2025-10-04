// FIX: Corrected the import statement for React and its hooks. The extraneous 'a,' was removed.
import React, { useState, useEffect, useCallback } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import { User, Expense, Category, Role, Status, Subcategory, AuditLogItem, Project, Site } from './types';
import * as Notifications from './notifications';
import { supabase, initializeSupabase } from './supabaseClient';
import SupabaseInstructions from './components/SupabaseInstructions';
import AdminSetup from './components/AdminSetup';
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
  status: dbProfile.status,
});

const App: React.FC = () => {
  const [isConfigured, setIsConfigured] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [auditLog, setAuditLog] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [needsAdminSetup, setNeedsAdminSetup] = useState(false);

  const handleSaveConfiguration = (url: string, key: string) => {
    if (initializeSupabase(url, key)) {
      setIsConfigured(true);
    } else {
      alert("Configuration failed. Please check the provided Supabase URL and Key and try again.");
    }
  };

  const fetchData = useCallback(async () => {
    if (!session || !isConfigured || !currentUser) return;
    setLoading(true);

    try {
      let expensesQuery = supabase
        .from('expenses')
        .select('*, profiles!requestor_id(name)')
        .order('submitted_at', { ascending: false });
      
      // FIX: This explicit client-side filter aligns with Row Level Security policies,
      // preventing errors for Requestor roles trying to fetch all expenses.
      if (currentUser.role === Role.REQUESTOR) {
        expensesQuery = expensesQuery.eq('requestor_id', currentUser.id);
      }

      const baseRequests = [
        supabase.from('profiles').select('*'),
        supabase.from('categories').select('*, subcategories(*)'),
        supabase.from('projects').select('*'),
        supabase.from('sites').select('*'),
        expensesQuery,
      ];

      const adminRequests = (currentUser.role === Role.ADMIN) ? [
        supabase.from('audit_log').select('*').order('timestamp', { ascending: false }),
      ] : [];

      const allRequests = [...baseRequests, ...adminRequests];
      
      const responses = await Promise.all(allRequests);

      const [
        usersRes,
        categoriesRes,
        projectsRes,
        sitesRes,
        expensesRes,
        ...adminResponses
      ] = responses;

      const auditLogRes = (currentUser.role === Role.ADMIN) ? adminResponses[0] : null;
      
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
        id: e.id,
        referenceNumber: e.reference_number,
        requestorId: e.requestor_id,
        requestorName: e.profiles.name,
        categoryId: e.category_id,
        subcategoryId: e.subcategory_id,
        amount: e.amount,
        description: e.description,
        projectId: e.project_id,
        siteId: e.site_id,
        submittedAt: e.submitted_at,
        status: e.status,
        isHighPriority: e.is_high_priority,
        attachment_path: e.attachment_path,
        subcategory_attachment_path: e.subcategory_attachment_path,
        history: e.history,
      }));
      setExpenses(fetchedExpenses);

      if (auditLogRes) {
        if (auditLogRes.error) throw auditLogRes.error;
        setAuditLog(auditLogRes.data.map((log: any) => ({
          ...log,
          actorId: log.actor_id,
          actorName: log.actor_name
        })));
      } else {
        setAuditLog([]);
      }

    } catch (error: any) {
      console.error("Error fetching data:", error);
      alert(`Could not fetch data from the server: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [session, isConfigured, currentUser]);

 useEffect(() => {
    const url = localStorage.getItem('VITE_SUPABASE_URL');
    const key = localStorage.getItem('VITE_SUPABASE_ANON_KEY');

    if (url && key && initializeSupabase(url, key)) {
      setIsConfigured(true);
    } else {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isConfigured) {
      return;
    }

    const initializeApp = async () => {
      setLoading(true);
      const { count, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', Role.ADMIN);

      if (error) {
        console.error("Error checking for admin user:", error.message);
        if (error.message.includes('permission denied') || error.message.includes('fetch')) {
             alert("Connection to Supabase failed. Please re-check your configuration.");
             localStorage.removeItem('VITE_SUPABASE_URL');
             localStorage.removeItem('VITE_SUPABASE_ANON_KEY');
             setIsConfigured(false);
        }
      }

      if (count === 0) {
        setNeedsAdminSetup(true);
        setLoading(false);
      } else {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setLoading(false);
      }
    };

    initializeApp();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, [isConfigured]);

  // FIX: This useEffect now ONLY fetches the user profile when the session changes.
  // This resolves the race condition by separating profile fetching from data fetching.
  useEffect(() => {
    if (!isConfigured) {
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
          setCurrentUser(null);
        } else if (data) {
          const user = mapDbUserToAppUser(data);
          if (user.status === 'disabled') {
              alert("Your account has been disabled. Please contact an administrator.");
              supabase.auth.signOut();
              setCurrentUser(null);
          } else {
              setCurrentUser(user);
          }
        }
      } else {
        setCurrentUser(null);
      }
    };
    fetchUserProfile();
  }, [session, isConfigured]);

  // FIX: This new useEffect ensures that data fetching only occurs AFTER a valid user profile has been loaded.
  useEffect(() => {
    if (currentUser && isConfigured) {
        fetchData();
    }
  }, [currentUser, isConfigured, fetchData]);


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
      try {
        const file = expenseData.attachment;
        const filePath = `${currentUser.id}/${Date.now()}_${file.name}`;
        const { error } = await supabase.storage.from('attachments').upload(filePath, file);
        if (error) throw error;
        attachment_path = filePath;
      } catch (error: any) {
        alert(`Failed to upload attachment: ${error.message}`);
        console.error(error);
        return;
      }
    }

    let subcategory_attachment_path: string | null = null;
    if (expenseData.subcategoryAttachment) {
      try {
        const file = expenseData.subcategoryAttachment;
        const filePath = `${currentUser.id}/${Date.now()}_sub_${file.name}`;
        const { error } = await supabase.storage.from('attachments').upload(filePath, file);
        if (error) throw error;
        subcategory_attachment_path = filePath;
      } catch (error: any) {
        alert(`Failed to upload subcategory attachment: ${error.message}`);
        console.error(error);
        return;
      }
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

    try {
      const expenseForDb = {
        reference_number: newExpense.referenceNumber,
        requestor_id: newExpense.requestorId,
        category_id: newExpense.categoryId,
        subcategory_id: newExpense.subcategoryId,
        amount: newExpense.amount,
        description: newExpense.description,
        project_id: newExpense.projectId,
        site_id: newExpense.siteId,
        submitted_at: newExpense.submittedAt,
        status: newExpense.status,
        is_high_priority: newExpense.isHighPriority,
        attachment_path: newExpense.attachment_path,
        subcategory_attachment_path: newExpense.subcategory_attachment_path,
        history: newExpense.history,
      };

      const { error: insertError } = await supabase.from('expenses').insert(expenseForDb);
      if (insertError) throw insertError;
    } catch(error: any) {
       alert(`Failed to create expense request: ${error.message}`);
       console.error(error);
       if (attachment_path) await supabase.storage.from('attachments').remove([attachment_path]);
       if (subcategory_attachment_path) await supabase.storage.from('attachments').remove([subcategory_attachment_path]);
       return;
    }


    await fetchData();

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

    const requestor = users.find(u => u.id === expenseToUpdate.requestorId);
    const category = categories.find(c => c.id === expenseToUpdate.categoryId);
    const subcategory = category?.subcategories?.find(sc => sc.id === expenseToUpdate.subcategoryId);
    const projectName = projects.find(p => p.id === expenseToUpdate.projectId)?.name || 'N/A';
    const siteName = sites.find(s => s.id === expenseToUpdate.siteId)?.name || 'N/A';

    if (requestor && category) {
        Notifications.notifyOnStatusChange(requestor, updatedExpense, category.name, subcategory?.name, projectName, siteName, comment);
        
        if (currentUser.role === Role.VERIFIER && newStatus === Status.PENDING_APPROVAL) {
            const approvers = users.filter(u => u.role === Role.APPROVER);
            Notifications.notifyApproversOnVerification(approvers, updatedExpense, category.name, subcategory?.name, projectName, siteName);
        }

        if (currentUser.role === Role.APPROVER && (newStatus === Status.APPROVED || newStatus === Status.REJECTED)) {
            const verifierAction = updatedHistory.find(h => h.action === 'Verified');
            if (verifierAction) {
                const verifier = users.find(u => u.id === verifierAction.actorId);
                if (verifier) {
                    Notifications.notifyVerifierOnFinalAction(verifier, currentUser, updatedExpense, category.name, subcategory?.name, projectName, siteName, comment);
                }
            }
        }
    }
  };

  const handleAddExpenseComment = async (expenseId: string, comment: string) => {
    if (!currentUser || !comment.trim()) return;
    const expenseToUpdate = expenses.find(e => e.id === expenseId);
    if (!expenseToUpdate) return;
    
    const newHistoryItem = {
        actorId: currentUser.id,
        actorName: currentUser.name,
        action: 'Comment',
        timestamp: new Date().toISOString(),
        comment
    };
    const updatedHistory = [...expenseToUpdate.history, newHistoryItem];
    const { error } = await supabase.from('expenses').update({ history: updatedHistory }).eq('id', expenseId);

    if (error) {
        alert("Failed to add comment.");
        console.error(error);
    } else {
        await fetchData(); 
        const participants = new Map<string, User>();
        participants.set(expenseToUpdate.requestorId, users.find(u => u.id === expenseToUpdate.requestorId)!);
        expenseToUpdate.history.forEach(h => {
          if (h.actorId !== 'system') {
            const user = users.find(u => u.id === h.actorId);
            if (user) participants.set(user.id, user);
          }
        });
        
        const recipients = Array.from(participants.values()).filter(u => u.id !== currentUser.id);
        const updatedExpense = { ...expenseToUpdate, history: updatedHistory };
        Notifications.notifyOnNewComment(recipients, currentUser, updatedExpense, comment);
    }
};

   const handleBulkUpdateExpenseStatus = async (expenseIds: string[], newStatus: Status, comment?: string) => {
    for (const id of expenseIds) {
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
      role: updatedUser.role
    }).eq('id', updatedUser.id);

    if(error) {
      console.error("Failed to update user:", error);
      let errorMessage = `Failed to update user: ${error.message}`;
      if (error.message.includes('duplicate key value violates unique constraint')) {
        errorMessage = 'Failed to update: The username you chose is already taken.';
      } else if (error.message.includes('permission denied')) {
        errorMessage = 'Failed to update: You do not have permission to perform this action.';
      }
      alert(errorMessage);
    }
    else {
      addAuditLogEntry('User Updated', `Updated profile for user '${updatedUser.username}'.`);
      await fetchData();
    }
  };
  
  const handleToggleUserStatus = async (userToUpdate: User) => {
    const newStatus = userToUpdate.status === 'active' ? 'disabled' : 'active';
    const action = newStatus === 'disabled' ? 'disable' : 'enable';
    if (!window.confirm(`Are you sure you want to ${action} the user account for ${userToUpdate.name}?`)) {
        return;
    }
    
    const { error } = await supabase.from('profiles').update({ status: newStatus }).eq('id', userToUpdate.id);
    
    if (error) {
        let errorMessage = `Failed to update user status: ${error.message}`;
        if (error.message.includes('permission denied')) {
            errorMessage = 'Failed to update status: You do not have permission to perform this action.';
        }
        alert(errorMessage);
    } else {
        addAuditLogEntry('User Status Changed', `Set user '${userToUpdate.name}' status to ${newStatus}.`);
        await fetchData();
    }
  };

  const handleResetUserPassword = async (userEmail: string, userName: string) => {
    if (!window.confirm(`Are you sure you want to send a password reset link to ${userName}? This will allow them to set a new password.`)) {
        return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(userEmail);
    if (error) {
        alert(`Failed to send password reset email: ${error.message}`);
        console.error(error);
    } else {
        alert(`Password reset link sent successfully to ${userEmail}.`);
        addAuditLogEntry('User Password Reset', `Sent password reset link to '${userName}'.`);
    }
  };
  
  const onCrudOperation = async (operation: any, successMessage: string, errorMessage: string) => {
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

  const handleUpdateUserProfile = async (name: string) => {
    if (!currentUser) return;
    const { error } = await supabase.from('profiles').update({ name }).eq('id', currentUser.id);
    if (error) {
      alert(`Failed to update profile: ${error.message}`);
    } else {
      alert('Profile updated successfully.');
      setCurrentUser(prev => prev ? { ...prev, name } : null);
      await fetchData();
    }
  };

  const handleUpdateUserPassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      alert(`Failed to update password: ${error.message}`);
    } else {
      alert('Password updated successfully.');
    }
  };

  const handleTriggerBackup = async () => {
    if (!currentUser || currentUser.role !== Role.ADMIN) {
      alert("You are not authorized to perform this action.");
      return;
    }
    if (!window.confirm("Are you sure you want to generate and email a full system backup? This may take a moment.")) {
      return;
    }
    
    setLoading(true);
    try {
      const [users, categories, projects, sites, expenses, auditLog] = await Promise.all([
        supabase.from('profiles').select('*'),
        supabase.from('categories').select('*, subcategories(*)'),
        supabase.from('projects').select('*'),
        supabase.from('sites').select('*'),
        supabase.from('expenses').select('*'),
        supabase.from('audit_log').select('*'),
      ]);
      const backupData = {
        users: users.data,
        categories: categories.data,
        projects: projects.data,
        sites: sites.data,
        expenses: expenses.data,
        auditLog: auditLog.data,
        backupTimestamp: new Date().toISOString()
      };
      const admins = users.data?.filter(u => u.role === Role.ADMIN).map(mapDbUserToAppUser) || [];
      Notifications.sendBackupEmail(admins, JSON.stringify(backupData, null, 2));
      alert("Backup generated and sent to all administrators successfully.");
      addAuditLogEntry('System Backup', 'Triggered a manual system backup via email.');
    } catch (error: any) {
      alert(`Failed to generate backup: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isConfigured) {
    return <SupabaseInstructions onSave={handleSaveConfiguration} />;
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (needsAdminSetup) {
    return <AdminSetup onAdminCreated={() => setNeedsAdminSetup(false)} />;
  }

  if (!session || !currentUser) {
    return <Login />;
  }
  
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
      onAddExpense={handleAddExpense}
      onUpdateExpenseStatus={handleUpdateExpenseStatus}
      onAddExpenseComment={handleAddExpenseComment}
      onBulkUpdateExpenseStatus={handleBulkUpdateExpenseStatus}
      onAddUser={() => alert("Users must sign up themselves.")}
      onUpdateUser={handleUpdateUser}
      onToggleUserStatus={handleToggleUserStatus}
      onResetUserPassword={handleResetUserPassword}
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
      onUpdateProfile={handleUpdateUserProfile}
      onUpdatePassword={handleUpdateUserPassword}
      onTriggerBackup={handleTriggerBackup}
    />
  );
};

export default App;
