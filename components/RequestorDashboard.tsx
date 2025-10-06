import React, { useState } from 'react';
import { User, Expense, Category, Role, Status, Project, Site, Company } from '../types';
import ExpenseList from './ExpenseList';

interface RequestorDashboardProps {
  currentUser: User;
  expenses: Expense[];
  categories: Category[];
  projects: Project[];
  sites: Site[];
  companies: Company[];
  onViewExpense: (expense: Expense) => void;
}

const RequestorDashboard: React.FC<RequestorDashboardProps> = ({ currentUser, expenses, categories, projects, sites, companies, onViewExpense }) => {
  const [statusFilter, setStatusFilter] = useState<Status | 'All'>('All');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });

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
    return true;
  });

  const formInputStyle = "relative block w-full px-4 py-3 bg-neutral-900/50 border border-neutral-700 text-neutral-50 placeholder-neutral-400 rounded-md appearance-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm";
  const formLabelStyle = "block text-sm font-medium text-neutral-300";

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-neutral-50">My Expenses</h2>
        <p className="mt-1 text-neutral-400">Track and manage all your submitted expense requests.</p>
      </div>

      <div className="p-6 bg-neutral-900/50 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
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
      </div>

      <ExpenseList 
        expenses={filteredExpenses} 
        categories={categories}
        projects={projects}
        sites={sites}
        companies={companies}
        title="My Expense History"
        emptyMessage="No expenses match the current filters."
        currentUser={currentUser}
        onViewExpense={onViewExpense}
      />
    </div>
  );
};

export default RequestorDashboard;