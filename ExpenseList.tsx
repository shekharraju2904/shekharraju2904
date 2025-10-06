import React, { useState } from 'react';
import { Expense, Category, Status, User } from '../types';
import { EyeIcon } from './Icons';
import Modal from './Modal';
import ExpenseCard from './ExpenseCard';

interface ExpenseListProps {
  expenses: Expense[];
  categories: Category[];
  title: string;
  emptyMessage: string;
  userRole?: User['role'];
  onUpdateStatus?: (expenseId: string, newStatus: Status, comment?: string) => void;
}

const formatDate = (isoString: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const day = date.getDate().toString().padStart(2, '0');
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
};

const ExpenseList: React.FC<ExpenseListProps> = ({ expenses, categories, title, emptyMessage, userRole, onUpdateStatus }) => {
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  
  const getCategoryName = (id: string) => categories.find(c => c.id === id)?.name || 'Unknown';

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
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0">Date</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Reference #</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Requestor</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Category</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Amount (₹)</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-0"><span className="sr-only">View</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {expenses.map((expense) => (
                    <tr key={expense.id}>
                      <td className="py-4 pl-4 pr-3 text-sm font-medium text-gray-900 whitespace-nowrap sm:pl-0">{formatDate(expense.submittedAt)}</td>
                      <td className="px-3 py-4 text-sm font-mono text-gray-500 whitespace-nowrap">{expense.referenceNumber}</td>
                      <td className="px-3 py-4 text-sm text-gray-500 whitespace-nowrap">{expense.requestorName}</td>
                      <td className="px-3 py-4 text-sm text-gray-500 whitespace-nowrap">{getCategoryName(expense.categoryId)}</td>
                      <td className="px-3 py-4 text-sm text-gray-500 whitespace-nowrap">₹{expense.amount.toLocaleString('en-IN')}</td>
                      <td className="px-3 py-4 text-sm text-gray-500 whitespace-nowrap"><StatusBadge status={expense.status} /></td>
                      <td className="relative py-4 pl-3 pr-4 text-sm font-medium text-right whitespace-nowrap sm:pr-0">
                        <button onClick={() => setSelectedExpense(expense)} className="text-primary hover:text-primary-hover"><EyeIcon className="w-5 h-5"/></button>
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
      
      {selectedExpense && (
        <Modal isOpen={!!selectedExpense} onClose={() => setSelectedExpense(null)} title="Expense Details">
            <ExpenseCard 
                expense={selectedExpense} 
                categoryName={getCategoryName(selectedExpense.categoryId)}
                userRole={userRole}
                onUpdateStatus={onUpdateStatus ? (status, comment) => {
                    onUpdateStatus(selectedExpense.id, status, comment);
                    setSelectedExpense(null);
                } : undefined}
                onClose={() => setSelectedExpense(null)}
            />
        </Modal>
      )}

    </div>
  );
};

export default ExpenseList;