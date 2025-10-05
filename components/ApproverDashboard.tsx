import React, { useState } from 'react';
import { Expense, Category, Status, Role, Project, Site, User } from '../types';
import ExpenseList from './ExpenseList';
import Modal from './Modal';
import { CheckCircleIcon, XCircleIcon } from './Icons';

interface ApproverDashboardProps {
  currentUser: User;
  expenses: Expense[];
  categories: Category[];
  projects: Project[];
  sites: Site[];
  onUpdateExpenseStatus: (expenseId: string, newStatus: Status, comment?: string) => void;
  onBulkUpdateExpenseStatus: (expenseIds: string[], newStatus: Status, comment?: string) => void;
  onToggleExpensePriority: (expenseId: string) => void;
  onViewExpense: (expense: Expense) => void;
}

const ApproverDashboard: React.FC<ApproverDashboardProps> = ({ currentUser, expenses, categories, projects, sites, onUpdateExpenseStatus, onBulkUpdateExpenseStatus, onToggleExpensePriority, onViewExpense }) => {
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [sortBy, setSortBy] = useState<'priority' | 'date'>('priority');
  const [selectedExpenseIds, setSelectedExpenseIds] = useState<string[]>([]);
  const [isBulkRejectModalOpen, setBulkRejectModalOpen] = useState(false);
  const [bulkRejectionComment, setBulkRejectionComment] = useState('');

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDateRange(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const filteredExpenses = expenses.filter(expense => {
    const submittedDateStr = new Date(expense.submittedAt).toISOString().split('T')[0];
    if (dateRange.from && submittedDateStr < dateRange.from) {
      return false;
    }
    if (dateRange.to && submittedDateStr > dateRange.to) {
      return false;
    }
    return true;
  });

  const sortedExpenses = [...filteredExpenses].sort((a, b) => {
    if (sortBy === 'priority') {
      if (a.isHighPriority && !b.isHighPriority) return -1;
      if (!a.isHighPriority && b.isHighPriority) return 1;
    }
    return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
  });

  const handleToggleSelection = (expenseId: string) => {
    setSelectedExpenseIds(prev =>
      prev.includes(expenseId)
        ? prev.filter(id => id !== expenseId)
        : [...prev, expenseId]
    );
  };

  const handleToggleSelectAll = () => {
    if (selectedExpenseIds.length === sortedExpenses.length) {
      setSelectedExpenseIds([]);
    } else {
      setSelectedExpenseIds(sortedExpenses.map(exp => exp.id));
    }
  };

  const handleBulkApprove = () => {
    if (window.confirm(`Are you sure you want to approve ${selectedExpenseIds.length} expense(s)?`)) {
      onBulkUpdateExpenseStatus(selectedExpenseIds, Status.APPROVED);
      setSelectedExpenseIds([]);
    }
  };

  const handleBulkReject = () => {
    onBulkUpdateExpenseStatus(selectedExpenseIds, Status.REJECTED, bulkRejectionComment);
    setSelectedExpenseIds([]);
    setBulkRejectModalOpen(false);
    setBulkRejectionComment('');
  };

  const formInputStyle = "relative block w-full px-4 py-3 bg-neutral-900/50 border border-neutral-700 text-neutral-50 placeholder-neutral-400 rounded-md appearance-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm";
  const formLabelStyle = "block text-sm font-medium text-neutral-300";

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-neutral-50">Approval Queue</h2>
        <p className="mt-1 text-neutral-400">Review and approve the following verified expense requests.</p>
      </div>

      <div className="p-6 bg-neutral-900/50 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
           <div>
            <label htmlFor="from-date" className={formLabelStyle}>From Date</label>
            <input 
              type="date" 
              id="from-date" 
              name="from" 
              value={dateRange.from} 
              onChange={handleDateChange} 
              className={`${formInputStyle} mt-1`} />
          </div>
          <div>
            <label htmlFor="to-date" className={formLabelStyle}>To Date</label>
            <input 
              type="date" 
              id="to-date" 
              name="to" 
              value={dateRange.to} 
              onChange={handleDateChange} 
              className={`${formInputStyle} mt-1`} />
          </div>
           <div>
            <label htmlFor="sort-by-approver" className={formLabelStyle}>Sort By</label>
            <select 
              id="sort-by-approver" 
              name="sort"
              value={sortBy} 
              onChange={e => setSortBy(e.target.value as 'date' | 'priority')} 
              className={`${formInputStyle} pr-10 mt-1`}
            >
              <option value="priority" className="bg-neutral-900">Priority</option>
              <option value="date" className="bg-neutral-900">Submission Date</option>
            </select>
          </div>
        </div>
      </div>

      <ExpenseList
        expenses={sortedExpenses}
        categories={categories}
        projects={projects}
        sites={sites}
        title="Pending Final Approval"
        emptyMessage="There are no expenses waiting for final approval in the selected date range."
        currentUser={currentUser}
        onUpdateStatus={onUpdateExpenseStatus}
        onToggleExpensePriority={onToggleExpensePriority}
        isSelectionEnabled={true}
        selectedExpenseIds={selectedExpenseIds}
        onToggleSelection={handleToggleSelection}
        onToggleSelectAll={handleToggleSelectAll}
        onViewExpense={onViewExpense}
      />
      
      {selectedExpenseIds.length > 0 && (
          <div className="fixed inset-x-0 bottom-0 z-30 p-4 bg-neutral-900/80 backdrop-blur-sm border-t border-white/10 shadow-lg md:bottom-4 md:inset-x-4 md:rounded-xl md:border">
            <div className="flex items-center justify-between max-w-6xl mx-auto">
              <span className="text-sm font-medium text-neutral-100">
                {selectedExpenseIds.length} item(s) selected
              </span>
              <div className="space-x-3">
                 <button onClick={() => setBulkRejectModalOpen(true)} className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-accent-danger/80 border border-transparent rounded-md shadow-sm hover:bg-accent-danger">
                    <XCircleIcon className="w-5 h-5 mr-2" />
                    Reject Selected
                </button>
                <button onClick={handleBulkApprove} className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-success/80 border border-transparent rounded-md shadow-sm hover:bg-success">
                    <CheckCircleIcon className="w-5 h-5 mr-2" />
                    Approve Selected
                </button>
              </div>
            </div>
          </div>
      )}

      <Modal isOpen={isBulkRejectModalOpen} onClose={() => setBulkRejectModalOpen(false)} title={`Reject ${selectedExpenseIds.length} Expense(s)`}>
        <div>
          <label htmlFor="bulk-rejection-comment" className={formLabelStyle}>Rejection Reason</label>
          <textarea
              id="bulk-rejection-comment"
              rows={3}
              value={bulkRejectionComment}
              onChange={(e) => setBulkRejectionComment(e.target.value)}
              className={`${formInputStyle} mt-1`}
              placeholder="Provide a single reason that will be applied to all selected expenses (optional)"
          ></textarea>
          <div className="flex justify-end mt-4 space-x-2">
            <button type="button" onClick={() => setBulkRejectModalOpen(false)} className="px-4 py-2 text-sm font-semibold text-neutral-200 bg-neutral-800/50 border border-neutral-700 rounded-md hover:bg-neutral-700/50 transition-colors">Cancel</button>
            <button onClick={handleBulkReject} className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-accent-danger rounded-md shadow-sm hover:bg-accent-danger/90">
                Confirm Rejection
            </button>
          </div>
        </div>
      </Modal>

    </div>
  );
};

export default ApproverDashboard;