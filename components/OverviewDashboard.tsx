import React from 'react';
import { Expense, Category, Status } from '../types';
import { DocumentArrowDownIcon } from './Icons';

interface OverviewDashboardProps {
  expenses: Expense[];
  categories: Category[];
}

const StatCard: React.FC<{ title: string; value: string | number; }> = ({ title, value }) => (
    <div className="px-4 py-5 overflow-hidden bg-white rounded-lg shadow sm:p-6">
        <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
        <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">{value}</dd>
    </div>
);

const OverviewDashboard: React.FC<OverviewDashboardProps> = ({ expenses, categories }) => {
    
    const totalAmount = expenses.reduce((acc, exp) => acc + exp.amount, 0);
    const pendingCount = expenses.filter(e => e.status === Status.PENDING_APPROVAL || e.status === Status.PENDING_VERIFICATION).length;
    const approvedCount = expenses.filter(e => e.status === Status.APPROVED).length;
    const rejectedCount = expenses.filter(e => e.status === Status.REJECTED).length;

    const recentExpenses = [...expenses].sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()).slice(0, 5);
    const getCategoryName = (id: string) => categories.find(c => c.id === id)?.name || 'Unknown';

    const handleDownloadCSV = () => {
        const header = ['ID', 'Reference', 'Requestor', 'Category', 'Amount', 'Description', 'Status', 'Submitted At'];
        const rows = expenses.map(exp => [
            exp.id,
            exp.referenceNumber,
            exp.requestorName,
            getCategoryName(exp.categoryId),
            exp.amount,
            `"${exp.description.replace(/"/g, '""')}"`, // Escape double quotes
            exp.status,
            new Date(exp.submittedAt).toISOString()
        ].join(','));

        const csvContent = [header.join(','), ...rows].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        if (link.href) {
            URL.revokeObjectURL(link.href);
        }
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', 'expenses_export.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
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
        <div>
            <div className="sm:flex sm:items-center sm:justify-between">
                <h2 className="text-2xl font-bold tracking-tight text-gray-900">System Overview</h2>
                <div className="mt-3 sm:ml-4 sm:mt-0">
                    <button
                        type="button"
                        onClick={handleDownloadCSV}
                        className="inline-flex items-center px-3 py-2 text-sm font-semibold text-white rounded-md shadow-sm bg-primary hover:bg-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                    >
                        <DocumentArrowDownIcon className="w-5 h-5 mr-2" />
                        Download as CSV
                    </button>
                </div>
            </div>
            
            <div className="grid grid-cols-1 gap-5 mt-6 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard title="Total Expenses" value={expenses.length} />
                <StatCard title="Total Value" value={`₹${totalAmount.toLocaleString('en-IN')}`} />
                <StatCard title="Pending Requests" value={pendingCount} />
                <StatCard title="Approved / Rejected" value={`${approvedCount} / ${rejectedCount}`} />
            </div>

            <div className="p-6 mt-8 bg-white rounded-lg shadow">
                <h3 className="text-lg font-medium leading-6 text-gray-900">Recent Activity</h3>
                <div className="flow-root mt-6">
                    {recentExpenses.length > 0 ? (
                    <ul className="-my-5 divide-y divide-gray-200">
                        {recentExpenses.map(expense => (
                        <li key={expense.id} className="py-4">
                            <div className="flex items-center space-x-4">
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                    <span className="font-mono">{expense.referenceNumber}</span> - {expense.requestorName}
                                </p>
                                <p className="text-sm text-gray-500 truncate">
                                    {getCategoryName(expense.categoryId)} on {new Date(expense.submittedAt).toLocaleDateString()}
                                </p>
                            </div>
                            <div>
                               <p className="mb-1 text-sm font-medium text-right text-gray-900">₹{expense.amount.toLocaleString('en-IN')}</p>
                               <StatusBadge status={expense.status} />
                            </div>
                            </div>
                        </li>
                        ))}
                    </ul>
                    ) : (
                         <div className="py-8 text-center">
                            <p className="text-sm text-gray-500">No expense activity to show.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OverviewDashboard;