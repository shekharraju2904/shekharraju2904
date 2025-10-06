import React, { useEffect, useRef } from 'react';
import { Expense, Category, Status, Project, Site, Company, User, Role } from '../types';
import { DocumentArrowDownIcon } from './Icons';

declare const Chart: any;

interface ReportsDashboardProps {
  expenses: Expense[];
  categories: Category[];
  projects: Project[];
  sites: Site[];
  companies: Company[];
  users: User[];
  currentUser: User;
}

const ReportsDashboard: React.FC<ReportsDashboardProps> = ({ expenses, categories, projects, sites, companies, users, currentUser }) => {
    const categoryChartRef = useRef<HTMLCanvasElement>(null);
    const projectChartRef = useRef<HTMLCanvasElement>(null);
    const companyChartRef = useRef<HTMLCanvasElement>(null);
    const monthlyChartRef = useRef<HTMLCanvasElement>(null);

    const chartColors = ['#3B82F6', '#14B8A6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#64748B', '#0D9488'];

    useEffect(() => {
        let categoryChart: any;
        let projectChart: any;
        let companyChart: any;
        let monthlyChart: any;
        Chart.defaults.color = '#94A3B8';
        Chart.defaults.font.family = 'Inter';

        if (categoryChartRef.current) {
            const ctx = categoryChartRef.current.getContext('2d');
            const expensesByCategory = categories.map(category => {
                const total = expenses
                    .filter(e => e.categoryId === category.id && e.status === Status.APPROVED)
                    .reduce((sum, e) => sum + e.amount, 0);
                return { name: category.name, total };
            }).filter(c => c.total > 0).sort((a,b) => b.total - a.total);

            categoryChart = new Chart(ctx, {
                type: 'pie',
                data: {
                    labels: expensesByCategory.map(c => c.name),
                    datasets: [{
                        data: expensesByCategory.map(c => c.total),
                        backgroundColor: chartColors,
                        borderColor: '#0F172A',
                        borderWidth: 4,
                        hoverOffset: 8,
                    }]
                },
                options: { 
                    responsive: true, 
                    plugins: { 
                        legend: { position: 'right', labels: { boxWidth: 12, padding: 15 } }, 
                        title: { display: true, text: 'Approved Spending by Category', font: { size: 16 }, color: '#F8FAFC', padding: { bottom: 20 } } 
                    } 
                }
            });
        }

        if (projectChartRef.current) {
            const ctx = projectChartRef.current.getContext('2d');
            const expensesByProject = projects.map(project => {
                const total = expenses
                    .filter(e => e.projectId === project.id && e.status === Status.APPROVED)
                    .reduce((sum, e) => sum + e.amount, 0);
                return { name: project.name, total };
            }).filter(p => p.total > 0).sort((a,b) => b.total - a.total);

            projectChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: expensesByProject.map(p => p.name),
                    datasets: [{
                         data: expensesByProject.map(p => p.total),
                         backgroundColor: chartColors.slice().reverse(),
                         borderColor: '#0F172A',
                         borderWidth: 4,
                         hoverOffset: 8,
                    }]
                },
                options: { 
                    responsive: true, 
                    cutout: '70%',
                    plugins: { 
                        legend: { position: 'right', labels: { boxWidth: 12, padding: 15 } }, 
                        title: { display: true, text: 'Approved Spending by Project', font: {size: 16}, color: '#F8FAFC', padding: { bottom: 20 } } 
                    } 
                }
            });
        }
        
        if (companyChartRef.current) {
            const ctx = companyChartRef.current.getContext('2d');
            const expensesByCompany = companies.map(company => {
                const total = expenses
                    .filter(e => e.companyId === company.id && e.status === Status.APPROVED)
                    .reduce((sum, e) => sum + e.amount, 0);
                return { name: company.name, total };
            }).filter(p => p.total > 0).sort((a,b) => b.total - a.total);

            companyChart = new Chart(ctx, {
                type: 'pie',
                data: {
                    labels: expensesByCompany.map(p => p.name),
                    datasets: [{
                         data: expensesByCompany.map(p => p.total),
                         backgroundColor: chartColors.slice(2).concat(chartColors.slice(0,2)),
                         borderColor: '#0F172A',
                         borderWidth: 4,
                         hoverOffset: 8,
                    }]
                },
                options: { 
                    responsive: true,
                    plugins: { 
                        legend: { position: 'right', labels: { boxWidth: 12, padding: 15 } }, 
                        title: { display: true, text: 'Approved Spending by Company', font: {size: 16}, color: '#F8FAFC', padding: { bottom: 20 } } 
                    } 
                }
            });
        }
        
        if (monthlyChartRef.current) {
            const ctx = monthlyChartRef.current.getContext('2d');
            const monthlyData: { [key: string]: number } = {};
            expenses.forEach(expense => {
                if (expense.status === Status.APPROVED) {
                    const month = new Date(expense.submittedAt).toLocaleString('default', { month: 'short', year: 'numeric' });
                    if (!monthlyData[month]) monthlyData[month] = 0;
                    monthlyData[month] += expense.amount;
                }
            });

            const sortedMonths = Object.keys(monthlyData).sort((a,b) => new Date(a).getTime() - new Date(b).getTime());

            monthlyChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: sortedMonths,
                    datasets: [{
                        label: 'Total Approved Amount (₹)',
                        data: sortedMonths.map(month => monthlyData[month]),
                        backgroundColor: 'rgba(59, 130, 246, 0.5)',
                        borderColor: 'rgba(59, 130, 246, 1)',
                        borderWidth: 2,
                        borderRadius: 8,
                        hoverBackgroundColor: 'rgba(59, 130, 246, 0.8)'
                    }]
                },
                 options: {
                    responsive: true,
                    plugins: { legend: { display: false }, title: { display: true, text: 'Monthly Spending Trend', font: {size: 16}, color: '#F8FAFC', padding: { bottom: 20 } } },
                    scales: { 
                        y: { beginAtZero: true, grid: { color: 'rgba(255, 255, 255, 0.1)' } },
                        x: { grid: { display: false } }
                    }
                }
            });
        }


        return () => {
            if (categoryChart) categoryChart.destroy();
            if (projectChart) projectChart.destroy();
            if (companyChart) companyChart.destroy();
            if (monthlyChart) monthlyChart.destroy();
        };
    }, [expenses, categories, projects, companies]);

    const handleDownloadTotalReport = () => {
        const getLookupName = (items: {id: string, name: string}[], id: string | undefined) => items.find(i => i.id === id)?.name || '';
        const getUser = (id: string | undefined) => users.find(u => u.id === id);

        const header = [
            "Reference Number", "Submission Date", "Requestor Name", "Requestor Email",
            "Company", "Project", "Site/Place", "Category", "Subcategory",
            "Amount (INR)", "Description", "Status", "High Priority",
            "Paid Date", "Paid By", "Payment Reference", "Last Action By", "Last Action Timestamp"
        ];

        const rows = expenses.map(exp => {
            const requestor = getUser(exp.requestorId);
            const category = categories.find(c => c.id === exp.categoryId);
            const subcategory = category?.subcategories?.find(sc => sc.id === exp.subcategoryId);
            const paidBy = exp.paidBy ? getUser(exp.paidBy) : null;
            const lastHistoryItem = exp.history[exp.history.length - 1];

            const sanitizedDescription = `"${(exp.description || '').replace(/"/g, '""')}"`;

            return [
                exp.referenceNumber,
                new Date(exp.submittedAt).toISOString(),
                requestor?.name || '',
                requestor?.email || '',
                getLookupName(companies, exp.companyId),
                getLookupName(projects, exp.projectId),
                getLookupName(sites, exp.siteId),
                category?.name || '',
                subcategory?.name || '',
                exp.amount,
                sanitizedDescription,
                exp.status,
                exp.isHighPriority ? 'Yes' : 'No',
                exp.paidAt ? new Date(exp.paidAt).toISOString() : '',
                paidBy?.name || '',
                exp.paymentReferenceNumber || '',
                lastHistoryItem?.actorName || '',
                lastHistoryItem ? new Date(lastHistoryItem.timestamp).toISOString() : ''
            ].join(',');
        });

        const csvContent = [header.join(','), ...rows].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `ExpenseFlow_Total_Report_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-8">
            <div className="sm:flex sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-neutral-50">Reports & Analytics</h2>
                    <p className="mt-1 text-neutral-400">Visualize spending patterns and gain insights into expense data.</p>
                </div>
                 {currentUser.role === Role.ADMIN && (
                    <div className="mt-4 sm:mt-0">
                        <button
                            type="button"
                            onClick={handleDownloadTotalReport}
                            className="inline-flex items-center px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-primary to-secondary rounded-md hover:opacity-90 transition-opacity"
                        >
                            <DocumentArrowDownIcon className="w-5 h-5 mr-2" />
                            Download Total Report
                        </button>
                    </div>
                )}
            </div>
            
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                <div className="p-6 bg-neutral-900/50 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl">
                    <canvas ref={categoryChartRef}></canvas>
                </div>
                <div className="p-6 bg-neutral-900/50 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl">
                    <canvas ref={projectChartRef}></canvas>
                </div>
            </div>
             <div className="p-6 bg-neutral-900/50 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl">
                 <canvas ref={companyChartRef}></canvas>
            </div>
            <div className="p-6 bg-neutral-900/50 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl">
                 <canvas ref={monthlyChartRef}></canvas>
            </div>
        </div>
    );
};

export default ReportsDashboard;