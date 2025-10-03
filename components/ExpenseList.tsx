import React, { useEffect, useRef } from 'react';
import { Expense, Category, Status, User, Project, Site } from '../types';
import { EyeIcon, StarIcon } from './Icons';

interface ExpenseListProps {
  expenses: Expense[];
  categories: Category[];
  projects: Project[];
  sites: Site[];
  title: string;
  emptyMessage: string;
  userRole?: User['role'];
  onViewExpense: (expense: Expense) => void;
  onUpdateStatus?: (expenseId: string, newStatus: Status, comment?: string) => void;
  onToggleExpensePriority?: (expenseId: string) => void;
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
  expenses, categories, projects, sites, title, emptyMessage, userRole, onViewExpense,
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
    const baseClasses = 'px-2 inline-flex text-xs leading-5 font-semibold rounded-full';
    switch (status) {
      case Status.APPROVED: return <span className={`${baseClasses} bg-green-100 text-green-800`}>{status}</span>;
      case Status.REJECTED: return <span className={`${baseClasses} bg-red-100 text-red-800`}>{status}</span>;
      case Status.PENDING_APPROVAL: return <span className={`${baseClasses} bg-yellow-100 text-yellow-800`}>{status}</span>;
      case Status.PENDING_VERIFICATION: return <span className={`${baseClasses} bg-blue-100 text-blue-800`}>{status}</span>;
      default: return <span className={`${baseClasses} bg-gray-100 text-gray-800`}>{status}</span>;
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h3 className="text-lg font-medium leading-6 text-gray-900">{title}</h3>
      <div className="flow-root mt-6">
        {expenses.length > 0 ? (
          <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
              <table className="min-w-full divide-y divide-gray-300">
                <thead>
                  <tr>
                    {isSelectionEnabled && onToggleSelectAll && (
                      <th scope="col" className="relative px-7 sm:w-12 sm:px-6">
                        <input
                          type="checkbox"
                          className="absolute w-4 h-4 -mt-2 text-primary border-gray-300 rounded left-4 top-1/2 focus:ring-primary"
                          ref={headerCheckboxRef}
                          onChange={onToggleSelectAll}
                        />
                      </th>
                    )}
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0">Date</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Reference #</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Project Name</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Site/Place</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Requestor</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Category</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Amount (₹)</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-0"><span className="sr-only">View</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {expenses.map((expense) => (
                    <tr key={expense.id} className={selectedExpenseIds.includes(expense.id) ? 'bg-primary-light' : ''}>
                      {isSelectionEnabled && onToggleSelection && (
                        <td className="relative px-7 sm:w-12 sm:px-6">
                          <input
                            type="checkbox"
                            className="absolute w-4 h-4 -mt-2 text-primary border-gray-300 rounded left-4 top-1/2 focus:ring-primary"
                            checked={selectedExpenseIds.includes(expense.id)}
                            onChange={() => onToggleSelection(expense.id)}
                          />
                        </td>
                      )}
                      <td className="py-4 pl-4 pr-3 text-sm font-medium text-gray-900 whitespace-nowrap sm:pl-0">{formatDate(expense.submittedAt)}</td>
                      <td className="px-3 py-4 text-sm font-mono text-gray-500 whitespace-nowrap">
                        <div className="flex items-center">
                          {expense.isHighPriority && <StarIcon filled className="w-4 h-4 mr-1 text-amber-500" aria-label="High Priority" />}
                          {expense.referenceNumber}
                        </div>
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-500 whitespace-nowrap">{getProjectName(expense.projectId)}</td>
                      <td className="px-3 py-4 text-sm text-gray-500 whitespace-nowrap">{getSiteName(expense.siteId)}</td>
                      <td className="px-3 py-4 text-sm text-gray-500 whitespace-nowrap">{expense.requestorName}</td>
                      <td className="px-3 py-4 text-sm text-gray-500 whitespace-nowrap">{getCategoryAndSubcategoryName(expense)}</td>
                      <td className="px-3 py-4 text-sm text-gray-500 whitespace-nowrap">{expense.amount.toLocaleString('en-IN')}</td>
                      <td className="px-3 py-4 text-sm text-gray-500 whitespace-nowrap"><StatusBadge status={expense.status} /></td>
                      <td className="relative py-4 pl-3 pr-4 text-sm font-medium text-right whitespace-nowrap sm:pr-0">
                        <button onClick={() => onViewExpense(expense)} className="text-primary hover:text-primary-hover"><EyeIcon className="w-5 h-5"/></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center">
            <p className="text-sm text-gray-500">{emptyMessage}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExpenseList;
