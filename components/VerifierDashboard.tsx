import React, { useState } from 'react';
import { Expense, Category, Status, Role, Project, Site } from '../types';
import ExpenseList from './ExpenseList';
import Modal from './Modal';
import { CheckCircleIcon, XCircleIcon } from './Icons';

interface VerifierDashboardProps {
  expenses: Expense[];
  categories: Category[];
  projects: Project[];
  sites: Site[];
  onUpdateExpenseStatus: (expenseId: string, newStatus: Status, comment?: string) => void;
  onBulkUpdateExpenseStatus: (expenseIds: string[], newStatus: Status, comment?: string) => void;
  onToggleExpensePriority: (expenseId: string) => void;
  onViewExpense: (expense: Expense) => void;
}

const VerifierDashboard: React.FC<VerifierDashboardProps> = ({ expenses, categories, projects, sites, onUpdateExpenseStatus, onBulkUpdateExpenseStatus, onToggleExpensePriority, onViewExpense }) => {
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
    if (window.confirm(`Are you sure you want to verify ${selectedExpenseIds.length} expense(s)?`)) {
        onBulkUpdateExpenseStatus(selectedExpenseIds, Status.PENDING_APPROVAL);
        setSelectedExpenseIds([]);
    }
  };

  const handleBulkReject = () => {
    onBulkUpdateExpenseStatus(selectedExpenseIds, Status.REJECTED, bulkRejectionComment);
    setSelectedExpenseIds([]);
    setBulkRejectModalOpen(false);
    setBulkRejectionComment('');
  };

  return (
    <div>
      <h2 className="text-2xl font-bold tracking-tight text-gray-900">Verification Queue</h2>
      <p className="mt-1 text-sm text-gray-600">Review and verify the following expense requests.</p>
      
      <div className="p-4 my-6 bg-white rounded-lg shadow">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
           <div>
            <label htmlFor="from-date" className="block text-sm font-medium text-gray-700">From Date</label>
            <input 
              type="date" 
              id="from-date" 
              name="from" 
              value={dateRange.from} 
              onChange={handleDateChange} 
              className="block w-full py-2 pl-3 pr-2 mt-1 text-base border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
          </div>
          <div>
            <label htmlFor="to-date" className="block text-sm font-medium text-gray-700">To Date</label>
            <input 
              type="date" 
              id="to-date" 
              name="to" 
              value={dateRange.to} 
              onChange={handleDateChange} 
              className="block w-full py-2 pl-3 pr-2 mt-1 text-base border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
          </div>
          <div>
            <label htmlFor="sort-by-verifier" className="block text-sm font-medium text-gray-700">Sort By</label>
            <select 
              id="sort-by-verifier" 
              name="sort"
              value={sortBy} 
              onChange={e => setSortBy(e.target.value as 'date' | 'priority')} 
              className="block w-full py-2 pl-3 pr-10 mt-1 text-base border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
            >
              <option value="priority">Priority</option>
              <option value="date">Submission Date</option>
            </select>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <ExpenseList
          expenses={sortedExpenses}
          categories={categories}
          projects={projects}
          sites={sites}
          title="Pending Verification"
          emptyMessage="There are no expenses waiting for verification in the selected date range."
          userRole={Role.VERIFIER}
          onUpdateStatus={onUpdateExpenseStatus}
          onToggleExpensePriority={onToggleExpensePriority}
          isSelectionEnabled={true}
          selectedExpenseIds={selectedExpenseIds}
          onToggleSelection={handleToggleSelection}
          onToggleSelectAll={handleToggleSelectAll}
          onViewExpense={onViewExpense}
        />
      </div>

       {selectedExpenseIds.length > 0 && (
          <div className="fixed inset-x-0 bottom-0 z-10 p-4 bg-white border-t border-gray-200 shadow-lg">
            <div className="flex items-center justify-between max-w-4xl mx-auto">
              <span className="text-sm font-medium text-gray-900">
                {selectedExpenseIds.length} item(s) selected
              </span>
              <div className="space-x-3">
                 <button onClick={() => setBulkRejectModalOpen(true)} className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md shadow-sm hover:bg-red-700">
                    <XCircleIcon className="w-5 h-5 mr-2" />
                    Reject Selected
                </button>
                <button onClick={handleBulkApprove} className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md shadow-sm hover:bg-green-700">
                    <CheckCircleIcon className="w-5 h-5 mr-2" />
                    Verify Selected
                </button>
              </div>
            </div>
          </div>
      )}

      <Modal isOpen={isBulkRejectModalOpen} onClose={() => setBulkRejectModalOpen(false)} title={`Reject ${selectedExpenseIds.length} Expense(s)`}>
        <div>
          <label htmlFor="bulk-rejection-comment" className="block text-sm font-medium text-gray-700">Rejection Reason</label>
          <textarea
              id="bulk-rejection-comment"
              rows={3}
              value={bulkRejectionComment}
              onChange={(e) => setBulkRejectionComment(e.target.value)}
              className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
              placeholder="Provide a single reason that will be applied to all selected expenses (optional)"
          ></textarea>
          <div className="flex justify-end mt-4 space-x-2">
              <button onClick={() => setBulkRejectModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50">Cancel</button>
              <button onClick={handleBulkReject} className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md shadow-sm hover:bg-red-700">
                  Confirm Rejection
              </button>
          </div>
        </div>
      </Modal>

    </div>
  );
};

export default VerifierDashboard;