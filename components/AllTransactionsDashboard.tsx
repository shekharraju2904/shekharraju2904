import React, { useState } from 'react';
import { Expense, Category, Status, Project, Site, User } from '../types';
import ExpenseList from './ExpenseList';
import { Role } from '../types';

interface AllTransactionsDashboardProps {
  expenses: Expense[];
  categories: Category[];
  projects: Project[];
  sites: Site[];
  currentUser: User;
  onViewExpense: (expense: Expense) => void;
  onSoftDeleteExpense?: (expenseId: string) => void;
}

const AllTransactionsDashboard: React.FC<AllTransactionsDashboardProps> = ({ expenses, categories, projects, sites, currentUser, onViewExpense, onSoftDeleteExpense }) => {
  const [statusFilter, setStatusFilter] = useState<Status | 'All'>('All');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [showMyActionsOnly, setShowMyActionsOnly] = useState(false);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDateRange(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const filteredExpenses = expenses.filter(expense => {
    if (statusFilter !== 'All' && expense.status !== statusFilter) {
      return false;
    }
    const submittedDateStr = new Date(expense.submittedAt).toISOString().split('T')[0];
    if (dateRange.from && submittedDateStr < dateRange.from) {
      return false;
    }
    if (dateRange.to && submittedDateStr > dateRange.to) {
      return false;
    }
    if (searchTerm) {
        const lowercasedTerm = searchTerm.toLowerCase();
        if (
            !expense.referenceNumber.toLowerCase().includes(lowercasedTerm) &&
            !expense.requestorName.toLowerCase().includes(lowercasedTerm) &&
            !expense.description.toLowerCase().includes(lowercasedTerm)
        ) {
            return false;
        }
    }
    if (showMyActionsOnly && (currentUser.role === Role.VERIFIER || currentUser.role === Role.APPROVER)) {
        if (!expense.history.some(h => h.actorId === currentUser.id && ['Verified', 'Approved', 'Rejected'].includes(h.action))) {
            return false;
        }
    }
    return true;
  }).sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());


  return (
    <div>
      <h2 className="text-2xl font-bold tracking-tight text-neutral-900">All Transactions</h2>
      <p className="mt-1 text-sm text-neutral-600">A complete log of all expense requests in the system.</p>

      <div className="p-4 my-6 bg-white rounded-xl shadow-lg border-t-4 border-indigo-400">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div>
            <label htmlFor="search-term" className="block text-sm font-medium text-neutral-700">Search</label>
            <input 
              type="text" 
              id="search-term" 
              name="search" 
              placeholder="Ref #, Requestor, Desc..."
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="block w-full py-2 pl-3 pr-2 mt-1 text-base border-neutral-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
          </div>
          <div>
            <label htmlFor="status-filter" className="block text-sm font-medium text-neutral-700">Status</label>
            <select 
              id="status-filter" 
              name="status"
              value={statusFilter} 
              onChange={e => setStatusFilter(e.target.value as Status | 'All')} 
              className="block w-full py-2 pl-3 pr-10 mt-1 text-base border-neutral-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            >
              <option value="All">All Statuses</option>
              {Object.values(Status).map(s => (<option key={s} value={s}>{s}</option>))}
            </select>
          </div>
           <div>
            <label htmlFor="from-date" className="block text-sm font-medium text-neutral-700">From</label>
            <input 
              type="date" 
              id="from-date" 
              name="from" 
              value={dateRange.from} 
              onChange={handleDateChange} 
              className="block w-full py-2 pl-3 pr-2 mt-1 text-base border-neutral-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
          </div>
          <div>
            <label htmlFor="to-date" className="block text-sm font-medium text-neutral-700">To</label>
            <input 
              type="date" 
              id="to-date" 
              name="to" 
              value={dateRange.to} 
              onChange={handleDateChange} 
              className="block w-full py-2 pl-3 pr-2 mt-1 text-base border-neutral-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
          </div>
        </div>
        {(currentUser.role === Role.VERIFIER || currentUser.role === Role.APPROVER) && (
            <div className="relative flex items-start pt-4 mt-4 border-t border-neutral-200">
                <div className="flex items-center h-5">
                    <input
                        id="my-actions-only"
                        name="my-actions-only"
                        type="checkbox"
                        checked={showMyActionsOnly}
                        onChange={(e) => setShowMyActionsOnly(e.target.checked)}
                        className="w-4 h-4 rounded text-primary-600 border-neutral-300 focus:ring-primary-500"
                    />
                </div>
                <div className="ml-3 text-sm">
                    <label htmlFor="my-actions-only" className="font-medium text-neutral-700">
                        Show only transactions I've actioned
                    </label>
                </div>
            </div>
        )}
      </div>

      <div className="mt-8">
        <ExpenseList 
          expenses={filteredExpenses} 
          categories={categories}
          projects={projects}
          sites={sites}
          title="Transaction History"
          emptyMessage="No expenses match the current filters."
          currentUser={currentUser}
          onViewExpense={onViewExpense}
          onSoftDeleteExpense={onSoftDeleteExpense}
        />
      </div>
    </div>
  );
};

export default AllTransactionsDashboard;