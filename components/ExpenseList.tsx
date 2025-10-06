import React, { useEffect, useRef } from 'react';
import { Expense, Category, Status, User, Project, Site, Role } from '../types';
import { EyeIcon, StarIcon, TrashIcon, CheckCircleIcon, XCircleIcon, Hourglass, CreditCardIcon } from './Icons';

interface ExpenseListProps {
  expenses: Expense[];
  categories: Category[];
  projects: Project[];
  sites: Site[];
  title: string;
  emptyMessage: string;
  currentUser: User;
  onViewExpense: (expense: Expense) => void;
  onUpdateStatus?: (expenseId: string, newStatus: Status, comment?: string) => void;
  onToggleExpensePriority?: (expenseId: string) => void;
  onSoftDeleteExpense?: (expenseId: string) => void;
  isSelectionEnabled?: boolean;
  selectedExpenseIds?: string[];
  onToggleSelection?: (expenseId: string) => void;
  onToggleSelectAll?: () => void;
}

const formatDate = (isoString: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
};

const ExpenseList: React.FC<ExpenseListProps> = ({ 
  expenses, categories, projects, sites, title, emptyMessage, currentUser, onViewExpense, onSoftDeleteExpense,
  isSelectionEnabled = false, selectedExpenseIds = [], onToggleSelection, onToggleSelectAll
}) => {
  const headerCheckboxRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (headerCheckboxRef.current) {
      const numSelected = selectedExpenseIds.length;
      const numItems = expenses.length;
      headerCheckboxRef.current.checked = numSelected > 0 && numSelected === numItems;
      headerCheckboxRef.current.indeterminate = numSelected > 0 && numSelected < numItems;
    }
  }, [selectedExpenseIds, expenses.length]);

  const getCategoryAndSubcategoryName = (expense: Expense): string => {
    const category = categories.find(c => c.id === expense.categoryId);
    if (!category) return 'Unknown';

    if (expense.subcategoryId) {
        const subcategory = category.subcategories?.find(sc => sc.id === expense.subcategoryId);
        if (subcategory) {
            return `${category.name} / ${subcategory.name}`;
        }
    }
    return category.name;
  };

  const getProjectName = (projectId: string): string => {
    return projects.find(p => p.id === projectId)?.name || 'Unknown Project';
  };
  
  const getSiteName = (siteId: string): string => {
    return sites.find(s => s.id === siteId)?.name || 'Unknown Site';
  };

  const StatusBadge = ({ status }: { status: Status }) => {
    const styles = {
      [Status.APPROVED]: 'bg-success/20 text-success',
      [Status.REJECTED]: 'bg-accent-danger/20 text-accent-danger',
      [Status.PENDING_APPROVAL]: 'bg-accent/20 text-accent',
      [Status.PENDING_VERIFICATION]: 'bg-primary/20 text-primary-light',
      [Status.PAID]: 'bg-teal-500/20 text-teal-300',
    };
    const icons = {
        [Status.APPROVED]: <CheckCircleIcon className="w-4 h-4" />,
        [Status.REJECTED]: <XCircleIcon className="w-4 h-4" />,
        [Status.PENDING_APPROVAL]: <Hourglass className="w-4 h-4 animate-spin" style={{ animationDuration: '3s' }} />,
        [Status.PENDING_VERIFICATION]: <Hourglass className="w-4 h-4 animate-spin" style={{ animationDuration: '3s' }} />,
        [Status.PAID]: <CreditCardIcon className="w-4 h-4" />,
    }
    const style = styles[status] || 'bg-neutral-500/20 text-neutral-300';
    const icon = icons[status] || null;

    return <span className={`inline-flex items-center gap-x-1.5 py-1 px-3 rounded-full text-xs font-medium ${style}`}>
        {icon}
        {status}
    </span>;
  };

  return (
    <div className="p-4 sm:p-6 bg-neutral-900/50 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl">
      <h3 className="text-lg font-semibold text-neutral-100">{title}</h3>
      <div className="flow-root mt-6">
        {expenses.length > 0 ? (
          <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
              <table className="min-w-full">
                <thead className="border-b border-white/10">
                  <tr>
                    {isSelectionEnabled && onToggleSelectAll && (
                      <th scope="col" className="relative px-7 sm:w-12 sm:px-6">
                        <input
                          type="checkbox"
                          className="w-4 h-4 text-primary bg-neutral-800 border-neutral-600 rounded focus:ring-primary"
                          ref={headerCheckboxRef}
                          onChange={onToggleSelectAll}
                        />
                      </th>
                    )}
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-neutral-100 sm:pl-0">Reference</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-neutral-100 hidden lg:table-cell">Requestor</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-neutral-100 hidden md:table-cell">Project</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-neutral-100">Amount</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-neutral-100 hidden sm:table-cell">Status</th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-0"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {expenses.map((expense) => (
                    <tr key={expense.id} className={`transition-colors duration-200 group ${selectedExpenseIds.includes(expense.id) ? 'bg-primary/10' : 'hover:bg-white/5'}`}>
                      {isSelectionEnabled && onToggleSelection && (
                        <td className="relative px-7 sm:w-12 sm:px-6">
                          <input
                            type="checkbox"
                            className="w-4 h-4 text-primary bg-neutral-800 border-neutral-600 rounded focus:ring-primary"
                            checked={selectedExpenseIds.includes(expense.id)}
                            onChange={() => onToggleSelection(expense.id)}
                          />
                        </td>
                      )}
                      <td className="py-4 pl-4 pr-3 text-sm whitespace-nowrap sm:pl-0">
                        <div className="flex items-center">
                          <div className="font-mono font-medium text-neutral-100">{expense.referenceNumber}</div>
                          {expense.isHighPriority && <StarIcon fill="currentColor" className="w-4 h-4 ml-2 text-accent" aria-label="High Priority" />}
                        </div>
                        <div className="mt-1 text-neutral-400 sm:hidden">{formatDate(expense.submittedAt)}</div>
                      </td>
                      <td className="hidden px-3 py-4 text-sm text-neutral-400 whitespace-nowrap lg:table-cell">{expense.requestorName}</td>
                      <td className="hidden px-3 py-4 text-sm text-neutral-400 whitespace-nowrap md:table-cell">{getProjectName(expense.projectId)}</td>
                      <td className="px-3 py-4 text-sm text-neutral-100 whitespace-nowrap font-semibold">₹{expense.amount.toLocaleString('en-IN')}</td>
                      <td className="hidden px-3 py-4 text-sm text-neutral-400 whitespace-nowrap sm:table-cell"><StatusBadge status={expense.status} /></td>
                      <td className="relative flex items-center justify-end py-4 pl-3 pr-4 space-x-2 text-sm font-medium text-right whitespace-nowrap sm:pr-0">
                        <button onClick={() => onViewExpense(expense)} className="p-2 text-neutral-400 rounded-md hover:bg-white/10 hover:text-white transition-colors" title="View Details"><EyeIcon className="w-5 h-5"/></button>
                        {currentUser.role === Role.ADMIN && onSoftDeleteExpense && (expense.status === Status.APPROVED || expense.status === Status.REJECTED) && (
                            <button
                                onClick={(e) => { e.stopPropagation(); onSoftDeleteExpense(expense.id); }}
                                className="p-2 text-neutral-400 rounded-md hover:bg-accent-danger/20 hover:text-accent-danger transition-colors"
                                title="Delete Expense"
                            >
                                <TrashIcon className="w-5 h-5"/>
                            </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="py-16 text-center border-2 border-dashed rounded-lg border-neutral-700">
            <p className="text-sm text-neutral-400">{emptyMessage}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExpenseList;