import React, { useState } from 'react';
import { Expense, Category, Status, Project, Site, User, Company } from '../types';
import ExpenseList from './ExpenseList';
import { Role } from '../types';

interface AllTransactionsDashboardProps {
  expenses: Expense[];
  categories: Category[];
  projects: Project[];
  sites: Site[];
  companies: Company[];
  currentUser: User;
  onViewExpense: (expense: Expense) => void;
  onSoftDeleteExpense?: (expenseId: string) => void;
}

const AllTransactionsDashboard: React.FC<AllTransactionsDashboardProps> = ({ expenses, categories, projects, sites, companies, currentUser, onViewExpense, onSoftDeleteExpense }) => {
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

  const formInputStyle = "relative block w-full px-4 py-3 bg-neutral-900/50 border border-neutral-700 text-neutral-50 placeholder-neutral-400 rounded-md appearance-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm";
  const formLabelStyle = "block text-sm font-medium text-neutral-300";

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-neutral-50">All Transactions</h2>
        <p className="mt-1 text-neutral-400">A complete log of all expense requests in the system.</p>
      </div>

      <div className="p-6 bg-neutral-900/50 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-4">
          <div>
            <label htmlFor="search-term" className={formLabelStyle}>Search</label>
            <input 
              type="text" 
              id="search-term" 
              name="search" 
              placeholder="Ref #, Requestor, Desc..."
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className={`${formInputStyle} mt-1`} />
          </div>
          <div>
            <label htmlFor="status-filter" className={formLabelStyle}>Status</label>
            <select 
              id="status-filter" 
              name="status"
              value={statusFilter} 
              onChange={e => setStatusFilter(e.target.value as Status | 'All')} 
              className={`${formInputStyle} pr-10 mt-1`}
            >
              <option value="All" className="bg-neutral-900">All Statuses</option>
              {Object.values(Status).map(s => (<option key={s} value={s} className="bg-neutral-900">{s}</option>))}
            </select>
          </div>
           <div>
            <label htmlFor="from-date" className={formLabelStyle}>From</label>
            <input 
              type="date" 
              id="from-date" 
              name="from" 
              value={dateRange.from} 
              onChange={handleDateChange} 
              className={`${formInputStyle} mt-1`} />
          </div>
          <div>
            <label htmlFor="to-date" className={formLabelStyle}>To</label>
            <input 
              type="date" 
              id="to-date" 
              name="to" 
              value={dateRange.to} 
              onChange={handleDateChange} 
              className={`${formInputStyle} mt-1`} />
          </div>
        </div>
        {(currentUser.role === Role.VERIFIER || currentUser.role === Role.APPROVER) && (
            <div className="relative flex items-start pt-6 mt-6 border-t border-white/10">
                <div className="flex items-center h-5">
                    <input
                        id="my-actions-only"
                        name="my-actions-only"
                        type="checkbox"
                        checked={showMyActionsOnly}
                        onChange={(e) => setShowMyActionsOnly(e.target.checked)}
                        className="w-4 h-4 bg-neutral-700 border-neutral-600 rounded text-primary focus:ring-primary"
                    />
                </div>
                <div className="ml-3 text-sm">
                    <label htmlFor="my-actions-only" className="font-medium text-neutral-300">
                        Show only transactions I've actioned
                    </label>
                </div>
            </div>
        )}
      </div>

      <ExpenseList 
        expenses={filteredExpenses} 
        categories={categories}
        projects={projects}
        sites={sites}
        companies={companies}
        title="Transaction History"
        emptyMessage="No expenses match the current filters."
        currentUser={currentUser}
        onViewExpense={onViewExpense}
        onSoftDeleteExpense={onSoftDeleteExpense}
      />
    </div>
  );
};

export default AllTransactionsDashboard;