import React, { useState } from 'react';
import { Expense, Category, Status, Project, Site, Subcategory } from '../types';
import { DocumentArrowDownIcon } from './Icons';

interface OverviewDashboardProps {
  expenses: Expense[];
  categories: Category[];
  projects: Project[];
  sites: Site[];
}

const StatCard: React.FC<{ title: string; value: string | number; }> = ({ title, value }) => (
    <div className="px-4 py-5 overflow-hidden bg-white rounded-xl shadow-lg sm:p-6">
        <dt className="text-sm font-medium text-neutral-500 truncate">{title}</dt>
        <dd className="mt-1 text-3xl font-semibold tracking-tight text-neutral-900">{value}</dd>
    </div>
);

const OverviewDashboard: React.FC<OverviewDashboardProps> = ({ expenses, categories, projects, sites }) => {
    
    const [filterProject, setFilterProject] = useState('All');
    const [filterSite, setFilterSite] = useState('All');
    const [filterCategory, setFilterCategory] = useState('All');
    const [filterSubcategory, setFilterSubcategory] = useState('All');
    const [subcategoriesForFilter, setSubcategoriesForFilter] = useState<Subcategory[]>([]);

    const totalAmount = expenses.reduce((acc, exp) => acc + exp.amount, 0);
    const pendingCount = expenses.filter(e => e.status === Status.PENDING_APPROVAL || e.status === Status.PENDING_VERIFICATION).length;
    const approvedCount = expenses.filter(e => e.status === Status.APPROVED).length;
    const rejectedCount = expenses.filter(e => e.status === Status.REJECTED).length;

    const recentExpenses = [...expenses].sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()).slice(0, 5);
    const getProjectName = (id: string) => projects.find(p => p.id === id)?.name || 'Unknown';
    
    const handleCategoryFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const catId = e.target.value;
        setFilterCategory(catId);
        setFilterSubcategory('All');
        if (catId === 'All') {
            setSubcategoriesForFilter([]);
        } else {
            const selectedCat = categories.find(c => c.id === catId);
            setSubcategoriesForFilter(selectedCat?.subcategories || []);
        }
    };

    const handleDownloadCSV = () => {
        const filteredForCSV = expenses.filter(exp => {
            if (filterProject !== 'All' && exp.projectId !== filterProject) return false;
            if (filterSite !== 'All' && exp.siteId !== filterSite) return false;
            if (filterCategory !== 'All' && exp.categoryId !== filterCategory) return false;
            if (filterSubcategory !== 'All' && exp.subcategoryId !== filterSubcategory) return false;
            return true;
        });

        const header = ['ID', 'Reference', 'Requestor', 'Project Name', 'Site/Place', 'Category', 'Subcategory', 'Amount', 'Description', 'Status', 'Submitted At'];
        const rows = filteredForCSV.map(exp => {
            const category = categories.find(c => c.id === exp.categoryId);
            const categoryName = category?.name || '';
            const subcategoryName = category?.subcategories?.find(sc => sc.id === exp.subcategoryId)?.name || '';
            const projectName = projects.find(p => p.id === exp.projectId)?.name || '';
            const siteName = sites.find(s => s.id === exp.siteId)?.name || '';
            return [
                exp.id,
                exp.referenceNumber,
                exp.requestorName,
                projectName,
                siteName,
                categoryName,
                subcategoryName,
                exp.amount,
                `"${exp.description.replace(/"/g, '""')}"`, // Escape double quotes
                exp.status,
                new Date(exp.submittedAt).toISOString()
            ].join(',');
        });

        const csvContent = [header.join(','), ...rows].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        if (link.href) {
            URL.revokeObjectURL(link.href);
        }
        const date = new Date().toISOString().split('T')[0];
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', `expenses_export_${date}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const StatusBadge = ({ status }: { status: Status }) => {
        const baseClasses = 'px-2 inline-flex text-xs leading-5 font-semibold rounded-full';
        switch (status) {
          case Status.APPROVED: return <span className={`${baseClasses} bg-success-100 text-success-800`}>{status}</span>;
          case Status.REJECTED: return <span className={`${baseClasses} bg-accent-100 text-accent-800`}>{status}</span>;
          case Status.PENDING_APPROVAL: return <span className={`${baseClasses} bg-amber-100 text-amber-800`}>{status}</span>;
          case Status.PENDING_VERIFICATION: return <span className={`${baseClasses} bg-secondary-100 text-secondary-800`}>{status}</span>;
          default: return <span className={`${baseClasses} bg-neutral-100 text-neutral-800`}>{status}</span>;
        }
    };


    return (
        <div>
            <h2 className="text-2xl font-bold tracking-tight text-neutral-900">System Overview</h2>
            
            <div className="p-4 my-6 bg-white rounded-xl shadow-lg">
                <h3 className="text-base font-semibold leading-6 text-neutral-900">Export Options</h3>
                <div className="grid grid-cols-1 gap-4 mt-2 sm:grid-cols-2 lg:grid-cols-5">
                    <div>
                        <label htmlFor="filter-project" className="block text-sm font-medium text-neutral-700">Project</label>
                        <select id="filter-project" value={filterProject} onChange={e => setFilterProject(e.target.value)} className="block w-full py-2 pl-3 pr-10 mt-1 text-base border-neutral-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm">
                            <option value="All">All Projects</option>
                            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>
                     <div>
                        <label htmlFor="filter-site" className="block text-sm font-medium text-neutral-700">Site/Place</label>
                        <select id="filter-site" value={filterSite} onChange={e => setFilterSite(e.target.value)} className="block w-full py-2 pl-3 pr-10 mt-1 text-base border-neutral-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm">
                            <option value="All">All Sites</option>
                            {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                     <div>
                        <label htmlFor="filter-category" className="block text-sm font-medium text-neutral-700">Category</label>
                        <select id="filter-category" value={filterCategory} onChange={handleCategoryFilterChange} className="block w-full py-2 pl-3 pr-10 mt-1 text-base border-neutral-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm">
                            <option value="All">All Categories</option>
                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="filter-subcategory" className="block text-sm font-medium text-neutral-700">Subcategory</label>
                        <select id="filter-subcategory" value={filterSubcategory} onChange={e => setFilterSubcategory(e.target.value)} disabled={filterCategory === 'All'} className="block w-full py-2 pl-3 pr-10 mt-1 text-base border-neutral-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm disabled:bg-neutral-100 disabled:cursor-not-allowed">
                            <option value="All">All Subcategories</option>
                            {subcategoriesForFilter.map(sc => <option key={sc.id} value={sc.id}>{sc.name}</option>)}
                        </select>
                    </div>
                    <div className="self-end">
                        <button
                            type="button"
                            onClick={handleDownloadCSV}
                            className="inline-flex items-center justify-center w-full px-3 py-2 text-sm font-semibold text-white transition-transform duration-200 transform rounded-md shadow-sm bg-gradient-to-r from-secondary-500 to-primary-500 hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
                        >
                            <DocumentArrowDownIcon className="w-5 h-5 mr-2" />
                            Download CSV
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-5 mt-6 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard title="Total Expenses" value={expenses.length} />
                <StatCard title="Total Value" value={`₹${totalAmount.toLocaleString('en-IN')}`} />
                <StatCard title="Pending Requests" value={pendingCount} />
                <StatCard title="Approved / Rejected" value={`${approvedCount} / ${rejectedCount}`} />
            </div>

            <div className="p-6 mt-8 bg-white rounded-xl shadow-lg">
                <h3 className="text-lg font-medium leading-6 text-neutral-900">Recent Activity</h3>
                <div className="flow-root mt-6">
                    {recentExpenses.length > 0 ? (
                    <ul className="-my-5 divide-y divide-neutral-200">
                        {recentExpenses.map(expense => (
                        <li key={expense.id} className="py-4">
                            <div className="flex items-center space-x-4">
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-neutral-900 truncate">
                                    <span className="font-mono">{expense.referenceNumber}</span> - {expense.requestorName}
                                </p>
                                <p className="text-sm text-neutral-500 truncate">
                                    Project: {getProjectName(expense.projectId)} on {new Date(expense.submittedAt).toLocaleDateString()}
                                </p>
                            </div>
                            <div className="text-right">
                               <p className="mb-1 text-sm font-medium text-neutral-900">₹{expense.amount.toLocaleString('en-IN')}</p>
                               <StatusBadge status={expense.status} />
                            </div>
                            </div>
                        </li>
                        ))}
                    </ul>
                    ) : (
                         <div className="py-8 text-center">
                            <p className="text-sm text-neutral-500">No expense activity to show.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OverviewDashboard;