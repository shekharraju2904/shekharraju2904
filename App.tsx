// FIX: Corrected the import statement for React and its hooks. The extraneous 'a,' was removed.
import React, { useState, useEffect, useCallback } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import { User, Expense, Category, Role, Status, Subcategory, AuditLogItem, Project, Site, Company } from './types';
import * as Notifications from './notifications';
import { supabase, initializeSupabase } from './supabaseClient';
import SupabaseInstructions from './components/SupabaseInstructions';
import AdminSetup from './components/AdminSetup';
import { Session } from '@supabase/supabase-js';
import LoadingSpinner from './components/LoadingSpinner';

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

const mapDbExpenseToAppExpense = (e: any, userMap: Map<string, string>): Expense => ({
    id: e.id,
    referenceNumber: e.reference_number,
    requestorId: e.requestor_id,
    requestorName: userMap.get(e.requestor_id) || 'Unknown User',
    categoryId: e.category_id,
    subcategoryId: e.subcategory_id,
    amount: e.amount,
    description: e.description,
    projectId: e.project_id,
    siteId: e.site_id,
    companyId: e.company_id,
    submittedAt: e.submitted_at,
    status: e.status,
    isHighPriority: e.is_high_priority,
    attachment_path: e.attachment_path,
    subcategory_attachment_path: e.subcategory_attachment_path,
    payment_attachment_path: e.payment_attachment_path,
    paidAt: e.paid_at,
    paidBy: e.paid_by,
    paymentReferenceNumber: e.payment_reference_number,
    history: e.history,
    deletedAt: e.deleted_at,
    deletedBy: e.deleted_by,
    statusBeforeDelete: e.status_before_delete,
});

const App: React.FC = () => {
  const [isConfigured, setIsConfigured] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [deletedExpenses, setDeletedExpenses] = useState<Expense[]>([]);
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
        .select('*')
        .is('deleted_at', null)
        .order('submitted_at', { ascending: false });

      const baseRequests = [
        supabase.from('profiles').select('*'),
        supabase.from('categories').select('*, subcategories(*)'),
        supabase.from('projects').select('*'),
        supabase.from('sites').select('*'),
        supabase.from('companies').select('*'),
        expensesQuery,
      ];

      const adminRequests = (currentUser.role === Role.ADMIN) ? [
        supabase.from('audit_log').select('*').order('timestamp', { ascending: false }),
        supabase.from('expenses').select('*').not('deleted_at', 'is', null).order('deleted_at', { ascending: false }),
      ] : [];

      const allRequests = [...baseRequests, ...adminRequests];
      
      const responses = await Promise.all(allRequests);

      const [
        usersRes,
        categoriesRes,
        projectsRes,
        sitesRes,
        companiesRes,
        expensesRes,
        ...adminResponses
      ] = responses;

      const auditLogRes = (currentUser.role === Role.ADMIN) ? adminResponses[0] : null;
      const deletedExpensesRes = (currentUser.role === Role.ADMIN) ? adminResponses[1] : null;
      
      if (usersRes.error) throw usersRes.error;
      const appUsers = usersRes.data.map(mapDbUserToAppUser);
      setUsers(appUsers);
      // FIX: Explicitly specify Map generic types to ensure correct type inference.
      const userMap = new Map<string, string>(appUsers.map(u => [u.id, u.name]));

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

      if (companiesRes.error) throw companiesRes.error;
      setCompanies(companiesRes.data);

      if (expensesRes.error) throw expensesRes.error;
      const fetchedExpenses = expensesRes.data.map((e: any) => mapDbExpenseToAppExpense(e, userMap));
      setExpenses(fetchedExpenses);

      if (deletedExpensesRes) {
        if (deletedExpensesRes.error) throw deletedExpensesRes.error;
        const fetchedDeletedExpenses = deletedExpensesRes.data.map((e: any) => mapDbExpenseToAppExpense(e, userMap));
        setDeletedExpenses(fetchedDeletedExpenses);
      } else {
        setDeletedExpenses([]);
      }

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

    } catch (error) {
      console.error("Error fetching data:", error);
      const message = (error && typeof error === 'object' && 'message' in error) ? (error as { message: string }).message : String(error);
      alert(`Could not fetch data from the server: ${message}`);
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
  };

  const handleAddExpense = async (expenseData: Omit<Expense, 'id' | 'status' | 'submittedAt' | 'history' | 'requestorId' | 'requestorName' | 'referenceNumber' | 'attachment_path' | 'subcategory_attachment_path' | 'payment_attachment_path'> & { attachment?: File, subcategoryAttachment?: File }) => {
    if (!currentUser) return;

    let attachment_path: string | null = null;
    if (expenseData.attachment) {
      try {
        const file = expenseData.attachment;
        const filePath = `${currentUser.id}/${Date.now()}_${file.name}`;
        const { error } = await supabase.storage.from('attachments').upload(filePath, file);
        if (error) throw error;
        attachment_path = filePath;
      } catch (error) {
        const message = (error && typeof error === 'object' && 'message' in error) ? (error as { message: string }).message : String(error);
        alert(`Failed to upload attachment: ${message}`);
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
      } catch (error) {
        const message = (error && typeof error === 'object' && 'message' in error) ? (error as { message: string }).message : String(error);
        alert(`Failed to upload subcategory attachment: ${message}`);
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
      payment_attachment_path: null,
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
        company_id: newExpense.companyId,
        submitted_at: newExpense.submittedAt,
        status: newExpense.status,
        is_high_priority: newExpense.isHighPriority,
        attachment_path: newExpense.attachment_path,
        subcategory_attachment_path: newExpense.subcategory_attachment_path,
        history: newExpense.history,
      };

      const { error: insertError } = await supabase.from('expenses').insert(expenseForDb);
      if (insertError) throw insertError;
    } catch(error) {
       const message = (error && typeof error === 'object' && 'message' in error) ? (error as { message: string }).message : String(error);
       alert(`Failed to create expense request: ${message}`);
       console.error(error);
       if (attachment_path) await supabase.storage.from('attachments').remove([attachment_path]);
       if (subcategory_attachment_path) await supabase.storage.from('attachments').remove([subcategory_attachment_path]);
       return;
    }


    await fetchData();

    const projectName = projects.find(p => p.id === newExpense.projectId)?.name || 'N/A';
    const siteName = sites.find(s => s.id === newExpense.siteId)?.name || 'N/A';
    const companyName = companies.find(c => c.id === newExpense.companyId)?.name || 'N/A';
    const subcategory = category?.subcategories?.find(sc => sc.id === newExpense.subcategoryId);
    if (category) {
        Notifications.notifyRequestorOnSubmission(currentUser, newExpense as Expense, category.name, subcategory?.name, projectName, siteName, companyName);
        if (newExpense.status === Status.PENDING_VERIFICATION) {
            const verifiers = users.filter(u => u.role === Role.VERIFIER);
            Notifications.notifyVerifiersOnSubmission(verifiers, newExpense as Expense, category.name, subcategory?.name, projectName, siteName, companyName);
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

    const { data, error } = await supabase
        .from('expenses')
        .update({ status: newStatus, history: updatedHistory })
        .eq('id', expenseId)
        .select();

    if (error || !data || data.length === 0) {
        const errorMessage = error ? error.message : "The expense could not be updated. It might have been processed by another user. Please refresh.";
        alert(`Failed to update status: ${errorMessage}`);
        console.error("Update failed. Error:", error, "Data:", data);
        await fetchData(); // Refresh data to show the user the current state
        return;
    }
    
    await fetchData();
    const updatedExpense = expenses.find(e => e.id === expenseId); // Re-find from refreshed data
    if (!updatedExpense) return;

    const requestor = users.find(u => u.id === updatedExpense.requestorId);
    const category = categories.find(c => c.id === updatedExpense.categoryId);
    const subcategory = category?.subcategories?.find(sc => sc.id === updatedExpense.subcategoryId);
    const projectName = projects.find(p => p.id === updatedExpense.projectId)?.name || 'N/A';
    const siteName = sites.find(s => s.id === updatedExpense.siteId)?.name || 'N/A';
    const companyName = companies.find(c => c.id === updatedExpense.companyId)?.name || 'N/A';

    if (requestor && category) {
        Notifications.notifyOnStatusChange(requestor, updatedExpense, category.name, subcategory?.name, projectName, siteName, companyName, comment);

        if (currentUser.role === Role.VERIFIER && newStatus === Status.PENDING_APPROVAL) {
            const approvers = users.filter(u => u.role === Role.APPROVER);
            Notifications.notifyApproversOnVerification(approvers, updatedExpense, category.name, subcategory?.name, projectName, siteName, companyName);
        }

        if (currentUser.role === Role.APPROVER && (newStatus === Status.APPROVED || newStatus === Status.REJECTED)) {
            const verifierAction = updatedHistory.find(h => h.action === 'Verified');
            if (verifierAction) {
                const verifier = users.find(u => u.id === verifierAction.actorId);
                if (verifier) {
                    Notifications.notifyVerifierOnFinalAction(verifier, currentUser, updatedExpense, category.name, subcategory?.name, projectName, siteName, companyName, comment);
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
        
        // Refetch the specific expense from the updated state to ensure we have the latest data
        const updatedExpense = expenses.find(e => e.id === expenseId);
        if (!updatedExpense) return; // Should not happen, but good practice

        const participants = new Map<string, User>();
        
        // 1. Add requestor
        const requestor = users.find(u => u.id === updatedExpense.requestorId);
        if (requestor) {
            participants.set(requestor.id, requestor);
        }
        
        // 2. Add everyone from the expense's history
        updatedExpense.history.forEach(h => {
          if (h.actorId !== 'system') {
            const user = users.find(u => u.id === h.actorId);
            if (user) participants.set(user.id, user);
          }
        });
        
        // 3. Add actors who are next in the workflow
        if (updatedExpense.status === Status.PENDING_VERIFICATION) {
            users.filter(u => u.role === Role.VERIFIER).forEach(v => participants.set(v.id, v));
        } else if (updatedExpense.status === Status.PENDING_APPROVAL) {
            users.filter(u => u.role === Role.APPROVER).forEach(a => participants.set(a, a));
        }
        
        // 4. Filter out the current user (commenter) to create the final recipients list
        const recipients = Array.from(participants.values()).filter(u => u.id !== currentUser.id);
        
        // 5. Send notifications
        Notifications.notifyOnNewComment(recipients, currentUser, updatedExpense, comment);
    }
};

   const handleBulkUpdateExpenseStatus = async (expenseIds: string[], newStatus: Status, comment?: string) => {
    if (!currentUser || expenseIds.length === 0) return;

    setLoading(true);

    const updatesWithHistory = expenseIds.map(id => {
        const expense = expenses.find(e => e.id === id);
        if (!expense) {
            return { id, error: `Expense with ID ${id} not found in local data.` };
        }
        
        const canVerify = currentUser.role === Role.VERIFIER && expense.status === Status.PENDING_VERIFICATION;
        const canApprove = currentUser.role === Role.APPROVER && expense.status === Status.PENDING_APPROVAL;
        const isActionAllowed = (newStatus === Status.PENDING_APPROVAL && canVerify) || (newStatus === Status.APPROVED && canApprove) || (newStatus === Status.REJECTED && (canVerify || canApprove));

        if (!isActionAllowed) {
            return { id, error: `You do not have permission to update expense ${expense.referenceNumber} from its current state of '${expense.status}'.` };
        }

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

        const updatedHistory = [...expense.history, newHistoryItem];
        return { id, updatePayload: { status: newStatus, history: updatedHistory }, error: null };
    });

    const validUpdates = updatesWithHistory.filter(u => !u.error);
    const clientSideErrors = updatesWithHistory.filter(u => u.error);

    const updatePromises = validUpdates.map(update => 
        supabase
            .from('expenses')
            .update(update.updatePayload!)
            .eq('id', update.id)
    );

    try {
        const results = await Promise.all(updatePromises);
        const serverSideErrors = results.filter(result => result.error);
        
        const totalFailures = clientSideErrors.length + serverSideErrors.length;
        const successCount = expenseIds.length - totalFailures;
        
        let actionVerb = '';
        if (newStatus === Status.PENDING_APPROVAL) actionVerb = 'Verified';
        else if (newStatus === Status.APPROVED) actionVerb = 'Approved';
        else if (newStatus === Status.REJECTED) actionVerb = 'Rejected';

        if (successCount > 0) {
            alert(`Successfully ${actionVerb.toLowerCase()} ${successCount} expense(s).`);
        }
        
        if (totalFailures > 0) {
            console.error('Client-side validation failures:', clientSideErrors.map(e => e.error));
            console.error('Server-side update failures:', serverSideErrors.map(e => e.error?.message));
            alert(`Failed to update ${totalFailures} of ${expenseIds.length} expense(s). Some items may have already been processed or you may lack permission. The view will now refresh.`);
        }
        
        if (expenseIds.length > 0) {
            await addAuditLogEntry('Bulk Expense Update', `Bulk action: ${actionVerb} ${expenseIds.length} expense(s). Success: ${successCount}, Failed: ${totalFailures}.`);
        }

    } catch (error) {
        console.error('Error during bulk update execution:', error);
        alert('An unexpected error occurred during the bulk update. Please check the console and refresh.');
    } finally {
        await fetchData();
    }
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
      await addAuditLogEntry('User Updated', `Updated profile for user '${updatedUser.username}'.`);
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
        await addAuditLogEntry('User Status Changed', `Set user '${userToUpdate.name}' status to ${newStatus}.`);
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
        await addAuditLogEntry('User Password Reset', `Sent password reset link to '${userName}'.`);
        await fetchData();
    }
  };
  
  const onCrudOperation = async (operation: any, successMessage: string, errorMessage: string) => {
    const { error } = await operation;
    if (error) {
      console.error(errorMessage, error);
      alert(`${errorMessage}: ${error.message}`);
    } else {
      await addAuditLogEntry('Configuration Change', successMessage);
      await fetchData();
    }
  };

  const handleAddCategory = (d: Omit<Category, 'id'>) => onCrudOperation(supabase.from('categories').insert({name: d.name, attachment_required: d.attachmentRequired, auto_approve_amount: d.autoApproveAmount}), `Created category '${d.name}'.`, 'Failed to create category.');
  const handleUpdateCategory = (d: Category) => onCrudOperation(supabase.from('categories').update({name: d.name, attachment_required: d.attachmentRequired, auto_approve_amount: d.autoApproveAmount}).eq('id', d.id), `Updated category '${d.name}'.`, 'Failed to update category.');
  // FIX: Renamed handler to avoid potential name collisions and align with coding patterns in the file.
  const handleDeleteCategory = (id: string) => onCrudOperation(supabase.from('categories').delete().eq('id', id), `Deleted category.`, 'Failed to delete category.');
  
  const handleAddSubcategory = (catId: string, d: Omit<Subcategory, 'id'>) => onCrudOperation(supabase.from('subcategories').insert({category_id: catId, name: d.name, attachment_required: d.attachmentRequired}), `Created subcategory '${d.name}'.`, 'Failed to create subcategory.');
  const handleUpdateSubcategory = (catId: string, d: Subcategory) => onCrudOperation(supabase.from('subcategories').update({name: d.name, attachment_required: d.attachmentRequired}).eq('id', d.id), `Updated subcategory '${d.name}'.`, 'Failed to update subcategory.');
  const onDeleteSubcategory = (catId: string, id: string) => onCrudOperation(supabase.from('subcategories').delete().eq('id', id), `Deleted subcategory.`, 'Failed to delete subcategory.');
  
  const handleAddProject = (d: Omit<Project, 'id'>) => onCrudOperation(supabase.from('projects').insert(d), `Created project '${d.name}'.`, 'Failed to create project.');
  const handleUpdateProject = (d: Project) => onCrudOperation(supabase.from('projects').update({name: d.name}).eq('id', d.id), `Updated project '${d.name}'.`, 'Failed to update project.');
  const onDeleteProject = (id: string) => onCrudOperation(supabase.from('projects').delete().eq('id', id), `Deleted project.`, 'Failed to delete project.');
  
  const handleAddSite = (d: Omit<Site, 'id'>) => onCrudOperation(supabase.from('sites').insert(d), `Created site '${d.name}'.`, 'Failed to create site.');
  const handleUpdateSite = (d: Site) => onCrudOperation(supabase.from('sites').update({name: d.name}).eq('id', d.id), `Updated site '${d.name}'.`, 'Failed to update site.');
  const onDeleteSite = (id: string) => onCrudOperation(supabase.from('sites').delete().eq('id', id), `Deleted site.`, 'Failed to delete site.');

  const handleAddCompany = (d: Omit<Company, 'id'>) => onCrudOperation(supabase.from('companies').insert(d), `Created company '${d.name}'.`, 'Failed to create company.');
  const handleUpdateCompany = (d: Company) => onCrudOperation(supabase.from('companies').update({name: d.name}).eq('id', d.id), `Updated company '${d.name}'.`, 'Failed to update company.');
  const onDeleteCompany = (id: string) => onCrudOperation(supabase.from('companies').delete().eq('id', id), `Deleted company.`, 'Failed to delete company.');

  const handleToggleExpensePriority = async (expenseId: string) => {
    const expenseToUpdate = expenses.find(e => e.id === expenseId);
    if (!expenseToUpdate) return;
    const newPriority = !expenseToUpdate.isHighPriority;
    const { error } = await supabase.from('expenses').update({ is_high_priority: newPriority }).eq('id', expenseId);
    if(error) console.error(error);
    else {
      const action = newPriority ? 'Marked as High Priority' : 'Removed High Priority';
      await addAuditLogEntry('Expense Priority Changed', `${action} for expense '${expenseToUpdate.referenceNumber}'.`);
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
      await addAuditLogEntry('System Backup', 'Triggered a manual system backup via email.');
      await fetchData();
    } catch (error) {
      const message = (error && typeof error === 'object' && 'message' in error) ? (error as { message: string }).message : String(error);
      alert(`Failed to generate backup: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSoftDeleteExpense = async (expenseId: string) => {
    if (!currentUser || currentUser.role !== Role.ADMIN) {
        alert("You are not authorized to perform this action.");
        return;
    }
    
    const expenseToDelete = expenses.find(e => e.id === expenseId);
    if (!expenseToDelete) {
        alert("Could not find the expense to delete.");
        return;
    }

    if (!window.confirm(`Are you sure you want to delete expense ${expenseToDelete.referenceNumber}? It will be moved to the Recycle Bin.`)) {
        return;
    }

    setLoading(true);
    try {
        const { error } = await supabase
            .from('expenses')
            .update({
                deleted_at: new Date().toISOString(),
                deleted_by: currentUser.id,
                status_before_delete: expenseToDelete.status,
                status: 'Deleted' // A temporary status while in recycle bin
            })
            .eq('id', expenseId);
        
        if (error) throw error;
        
        await addAuditLogEntry('Expense Soft Deleted', `Moved expense '${expenseToDelete.referenceNumber}' to Recycle Bin.`);
        alert("Expense moved to Recycle Bin.");
        await fetchData();

    } catch (error) {
        const message = (error && typeof error === 'object' && 'message' in error) ? (error as { message: string }).message : String(error);
        alert(`Failed to move expense to Recycle Bin: ${message}`);
    } finally {
        setLoading(false);
    }
  };

  const handleRestoreExpense = async (expenseId: string) => {
      if (!currentUser || currentUser.role !== Role.ADMIN) {
          alert("You are not authorized to perform this action.");
          return;
      }
      const expenseToRestore = deletedExpenses.find(e => e.id === expenseId);
      if (!expenseToRestore) {
          alert("Could not find the expense to restore.");
          return;
      }

      setLoading(true);
      try {
          const { error } = await supabase
              .from('expenses')
              .update({
                  deleted_at: null,
                  deleted_by: null,
                  status: expenseToRestore.statusBeforeDelete,
                  status_before_delete: null,
              })
              .eq('id', expenseId);

          if (error) throw error;
          
          await addAuditLogEntry('Expense Restored', `Restored expense '${expenseToRestore.referenceNumber}' from Recycle Bin.`);
          alert("Expense restored successfully.");
          await fetchData();
      } catch (error) {
          const message = (error && typeof error === 'object' && 'message' in error) ? (error as { message: string }).message : String(error);
          alert(`Failed to restore expense: ${message}`);
      } finally {
          setLoading(false);
      }
  };

  const handlePermanentlyDeleteExpense = async (expenseId: string) => {
    if (!currentUser || currentUser.role !== Role.ADMIN) {
        alert("You are not authorized to perform this action.");
        return;
    }
    
    const expenseToDelete = deletedExpenses.find(e => e.id === expenseId);
    if (!expenseToDelete) {
        alert("Could not find the expense to delete.");
        return;
    }

    if (!window.confirm(`Are you sure you want to PERMANENTLY delete expense ${expenseToDelete.referenceNumber}? This action cannot be undone.`)) {
        return;
    }

    setLoading(true);
    try {
        const pathsToRemove: string[] = [];
        if (expenseToDelete.attachment_path) pathsToRemove.push(expenseToDelete.attachment_path);
        if (expenseToDelete.subcategory_attachment_path) pathsToRemove.push(expenseToDelete.subcategory_attachment_path);

        if (pathsToRemove.length > 0) {
            const { error: storageError } = await supabase.storage.from('attachments').remove(pathsToRemove);
            if (storageError) console.error("Could not delete attachment(s), but proceeding:", storageError);
        }

        const { error: dbError } = await supabase.from('expenses').delete().eq('id', expenseId);
        if (dbError) throw dbError;

        await addAuditLogEntry('Expense Permanently Deleted', `Permanently deleted expense '${expenseToDelete.referenceNumber}'.`);
        alert("Expense permanently deleted.");
        await fetchData();

    } catch (error) {
        const message = (error && typeof error === 'object' && 'message' in error) ? (error as { message: string }).message : String(error);
        alert(`Failed to permanently delete expense: ${message}`);
    } finally {
        setLoading(false);
    }
  };

  const handleMarkAsPaid = async (expenseId: string, paymentAttachment: File, paymentReferenceNumber: string) => {
    if (!currentUser) return;
    const expenseToUpdate = expenses.find(e => e.id === expenseId);
    if (!expenseToUpdate) {
        alert("Could not find the expense to update.");
        return;
    }

    setLoading(true);
    let payment_attachment_path: string | null = null;
    try {
        const filePath = `${currentUser.id}/payment_${Date.now()}_${paymentAttachment.name}`;
        const { error: uploadError } = await supabase.storage.from('attachments').upload(filePath, paymentAttachment);
        if (uploadError) throw uploadError;
        payment_attachment_path = filePath;

        const newHistoryItem = {
            actorId: currentUser.id,
            actorName: currentUser.name,
            action: 'Paid',
            timestamp: new Date().toISOString(),
        };
        const updatedHistory = [...expenseToUpdate.history, newHistoryItem];

        const { error: updateError } = await supabase
            .from('expenses')
            .update({
                status: Status.PAID,
                paid_at: new Date().toISOString(),
                paid_by: currentUser.id,
                payment_attachment_path,
                payment_reference_number: paymentReferenceNumber,
                history: updatedHistory,
            })
            .eq('id', expenseId);
        
        if (updateError) throw updateError;

        await addAuditLogEntry('Expense Paid', `Marked expense '${expenseToUpdate.referenceNumber}' as paid.`);
        alert("Expense marked as paid.");
        await fetchData();

        const requestor = users.find(u => u.id === expenseToUpdate.requestorId);
        if (requestor) {
            const newlyPaidExpense = { 
                ...expenseToUpdate, 
                status: Status.PAID, 
                paymentReferenceNumber 
            };
            Notifications.notifyRequestorOnPayment(requestor, newlyPaidExpense);
        }

    } catch (error) {
        const message = (error && typeof error === 'object' && 'message' in error) ? (error as { message: string }).message : String(error);
        alert(`Failed to mark expense as paid: ${message}`);
        if (payment_attachment_path) {
            await supabase.storage.from('attachments').remove([payment_attachment_path]);
        }
    } finally {
        setLoading(false);
    }
  };


  if (!isConfigured) {
    return <SupabaseInstructions onSave={handleSaveConfiguration} />;
  }

  if (loading && !currentUser) {
    return <LoadingSpinner />;
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
      companies={companies}
      expenses={expenses}
      deletedExpenses={deletedExpenses}
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
      onDeleteCategory={handleDeleteCategory}
      onAddSubcategory={handleAddSubcategory}
      // FIX: Corrected a typo in the prop name. It should be `handleUpdateSubcategory`.
      onUpdateSubcategory={handleUpdateSubcategory}
      onDeleteSubcategory={onDeleteSubcategory}
      onToggleExpensePriority={handleToggleExpensePriority}
      onAddProject={handleAddProject}
      onUpdateProject={handleUpdateProject}
      onDeleteProject={onDeleteProject}
      onAddSite={handleAddSite}
      onUpdateSite={handleUpdateSite}
      onDeleteSite={onDeleteSite}
      onAddCompany={handleAddCompany}
      onUpdateCompany={handleUpdateCompany}
      onDeleteCompany={onDeleteCompany}
      onUpdateProfile={handleUpdateUserProfile}
      onUpdatePassword={handleUpdateUserPassword}
      onTriggerBackup={handleTriggerBackup}
      onSoftDeleteExpense={handleSoftDeleteExpense}
      onRestoreExpense={handleRestoreExpense}
      onPermanentlyDeleteExpense={handlePermanentlyDeleteExpense}
      onMarkAsPaid={handleMarkAsPaid}
      isLoading={loading}
    />
  );
};

export default App;
