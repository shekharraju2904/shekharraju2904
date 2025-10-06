import React, { useState } from 'react';
import { User, Expense, Category, Role, Status, Subcategory, AuditLogItem, Project, Site } from '../types';
import SideNav from './SideNav';
import AdminPanel from './AdminPanel';
import RequestorDashboard from './RequestorDashboard';
import VerifierDashboard from './VerifierDashboard';
import ApproverDashboard from './ApproverDashboard';
import OverviewDashboard from './OverviewDashboard';
import ReportsDashboard from './ReportsDashboard';
import ProfilePage from './ProfilePage';
import Modal from './Modal';
import ExpenseForm from './ExpenseForm';
import ExpenseCard from './ExpenseCard';
import AllTransactionsDashboard from './AllTransactionsDashboard';
import LoadingSpinner from './LoadingSpinner';

interface DashboardProps {
  currentUser: User;
  users: User[];
  categories: Category[];
  projects: Project[];
  sites: Site[];
  expenses: Expense[];
  deletedExpenses: Expense[];
  auditLog: AuditLogItem[];
  isLoading: boolean;
  onLogout: () => void;
  onAddExpense: (expenseData: Omit<Expense, 'id' | 'status' | 'submittedAt' | 'history' | 'requestorId' | 'requestorName' | 'referenceNumber' | 'attachment_path' | 'subcategory_attachment_path' | 'payment_attachment_path'> & { attachment?: File, subcategoryAttachment?: File }) => void;
  onUpdateExpenseStatus: (expenseId: string, newStatus: Status, comment?: string) => void;
  onAddExpenseComment: (expenseId: string, comment: string) => void;
  onBulkUpdateExpenseStatus: (expenseIds: string[], newStatus: Status, comment?: string) => void;
  onAddUser: (user: Omit<User, 'id'>) => void;
  onUpdateUser: (user: User) => void;
  onToggleUserStatus: (user: User) => void;
  onResetUserPassword: (userEmail: string, userName: string) => void;
  onAddCategory: (category: Omit<Category, 'id'>) => void;
  onUpdateCategory: (category: Category) => void;
  onDeleteCategory: (categoryId: string) => void;
  onAddSubcategory: (categoryId: string, subcategoryData: Omit<Subcategory, 'id'>) => void;
  onUpdateSubcategory: (categoryId: string, updatedSubcategory: Subcategory) => void;
  onDeleteSubcategory: (categoryId: string, subcategoryId: string) => void;
  onToggleExpensePriority: (expenseId: string) => void;
  onAddProject: (project: Omit<Project, 'id'>) => void;
  onUpdateProject: (project: Project) => void;
  onDeleteProject: (projectId: string) => void;
  onAddSite: (site: Omit<Site, 'id'>) => void;
  onUpdateSite: (site: Site) => void;
  onDeleteSite: (siteId: string) => void;
  onUpdateProfile: (name: string) => void;
  onUpdatePassword: (password: string) => void;
  onTriggerBackup: () => void;
  onSoftDeleteExpense: (expenseId: string) => void;
  onRestoreExpense: (expenseId: string) => void;
  onPermanentlyDeleteExpense: (expenseId: string) => void;
  onMarkAsPaid: (expenseId: string, attachment: File, paymentReferenceNumber: string) => void;
}

const Dashboard: React.FC<DashboardProps> = (props) => {
  const { currentUser, onLogout, expenses, categories, projects, sites, onAddExpense, onUpdateExpenseStatus, onAddExpenseComment, onSoftDeleteExpense, onMarkAsPaid, ...adminProps } = props;
  const [activeView, setActiveView] = useState('overview');
  const [activeAdminTab, setActiveAdminTab] = useState('users');
  const [isNewExpenseModalOpen, setNewExpenseModalOpen] = useState(false);
  const [modalExpense, setModalExpense] = useState<Expense | null>(null);

  const renderActiveView = () => {
    if (props.isLoading) {
      return <div className="flex items-center justify-center w-full h-full"><LoadingSpinner /></div>;
    }
    
    const requestorExpenses = expenses.filter(e => e.requestorId === currentUser.id);
    const verifierExpenses = expenses.filter(e => e.status === Status.PENDING_VERIFICATION);
    const approverExpenses = expenses.filter(e => e.status === Status.PENDING_APPROVAL);

    switch (activeView) {
      case 'overview':
        const overviewExpenses = currentUser.role === Role.REQUESTOR ? requestorExpenses : expenses;
        return <OverviewDashboard expenses={overviewExpenses} categories={categories} projects={projects} sites={sites} />;
      
      case 'tasks':
        switch (currentUser.role) {
          case Role.REQUESTOR:
            return <RequestorDashboard currentUser={currentUser} expenses={requestorExpenses} categories={categories} projects={projects} sites={sites} onViewExpense={setModalExpense} />;
          case Role.VERIFIER:
            return <VerifierDashboard currentUser={currentUser} expenses={verifierExpenses} categories={categories} projects={projects} sites={sites} onUpdateExpenseStatus={onUpdateExpenseStatus} onBulkUpdateExpenseStatus={adminProps.onBulkUpdateExpenseStatus} onToggleExpensePriority={adminProps.onToggleExpensePriority} onViewExpense={setModalExpense} />;
          case Role.APPROVER:
            return <ApproverDashboard currentUser={currentUser} expenses={approverExpenses} categories={categories} projects={projects} sites={sites} onUpdateExpenseStatus={onUpdateExpenseStatus} onBulkUpdateExpenseStatus={adminProps.onBulkUpdateExpenseStatus} onToggleExpensePriority={adminProps.onToggleExpensePriority} onViewExpense={setModalExpense} />;
          default:
            return <p>No tasks available for your role.</p>;
        }

      case 'all_transactions':
        return <AllTransactionsDashboard expenses={expenses} categories={categories} projects={projects} sites={sites} currentUser={currentUser} onViewExpense={setModalExpense} onSoftDeleteExpense={onSoftDeleteExpense} />;

      case 'reports':
        return <ReportsDashboard expenses={expenses} categories={categories} projects={projects} sites={sites} />;

      case 'profile':
        return <ProfilePage user={currentUser} onUpdateProfile={props.onUpdateProfile} onUpdatePassword={props.onUpdatePassword} />;

      case 'admin':
        if (currentUser.role === Role.ADMIN) {
          return <AdminPanel 
            {...adminProps} 
            expenses={expenses} 
            categories={categories} 
            projects={projects} 
            sites={sites} 
            onTriggerBackup={props.onTriggerBackup} 
            activeAdminTab={activeAdminTab}
            setActiveAdminTab={setActiveAdminTab}
            />;
        }
        return null;

      default:
        return <OverviewDashboard expenses={requestorExpenses} categories={categories} projects={projects} sites={sites} />;
    }
  };

  return (
    <div className="flex w-full h-screen">
      <SideNav 
        user={currentUser}
        onLogout={onLogout}
        activeView={activeView}
        setActiveView={setActiveView}
        onNewExpenseClick={() => setNewExpenseModalOpen(true)}
      />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 ml-0 md:ml-20 lg:ml-64">
        {renderActiveView()}
      </main>

      <Modal isOpen={isNewExpenseModalOpen} onClose={() => setNewExpenseModalOpen(false)} title="New Expense Request">
        <ExpenseForm 
            categories={categories}
            projects={projects}
            sites={sites}
            onSubmit={onAddExpense}
            onClose={() => setNewExpenseModalOpen(false)}
        />
      </Modal>

      {modalExpense && (
        <Modal isOpen={!!modalExpense} onClose={() => setModalExpense(null)} title={`Expense ${modalExpense.referenceNumber}`}>
            <ExpenseCard 
                expense={modalExpense} 
                categories={categories}
                projects={projects}
                sites={sites}
                userRole={currentUser.role}
                currentUser={currentUser}
                onUpdateStatus={onUpdateExpenseStatus ? (status, comment) => {
                    // FIX: Corrected a typo in the function call. It should be `onUpdateExpenseStatus`, not `onUpdateStatus`.
                    onUpdateExpenseStatus(modalExpense.id, status, comment);
                    setModalExpense(null);
                } : undefined}
                onAddComment={onAddExpenseComment}
                onToggleExpensePriority={adminProps.onToggleExpensePriority}
                onSoftDeleteExpense={onSoftDeleteExpense ? () => {
                  onSoftDeleteExpense(modalExpense.id);
                  setModalExpense(null);
                } : undefined}
                onMarkAsPaid={onMarkAsPaid ? (expenseId, attachment, paymentRef) => {
                    onMarkAsPaid(expenseId, attachment, paymentRef);
                    setModalExpense(null);
                } : undefined}
                onClose={() => setModalExpense(null)}
            />
        </Modal>
      )}
    </div>
  );
};

export default Dashboard;