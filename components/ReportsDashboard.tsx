import React, { useEffect, useRef } from 'react';
import { Expense, Category, Status, Project, Site } from '../types';

declare const Chart: any;

interface ReportsDashboardProps {
  expenses: Expense[];
  categories: Category[];
  projects: Project[];
  sites: Site[];
}

const ReportsDashboard: React.FC<ReportsDashboardProps> = ({ expenses, categories, projects, sites }) => {
    const categoryChartRef = useRef<HTMLCanvasElement>(null);
    const projectChartRef = useRef<HTMLCanvasElement>(null);
    const monthlyChartRef = useRef<HTMLCanvasElement>(null);

    const chartColors = ['#6366f1', '#0ea5e9', '#f43f5e', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899', '#64748b'];

    useEffect(() => {
        let categoryChart: any;
        let projectChart: any;
        let monthlyChart: any;

        if (categoryChartRef.current) {
            const ctx = categoryChartRef.current.getContext('2d');
            const expensesByCategory = categories.map(category => {
                const total = expenses
                    .filter(e => e.categoryId === category.id && e.status === Status.APPROVED)
                    .reduce((sum, e) => sum + e.amount, 0);
                return { name: category.name, total };
            }).filter(c => c.total > 0);

            categoryChart = new Chart(ctx, {
                type: 'pie',
                data: {
                    labels: expensesByCategory.map(c => c.name),
                    datasets: [{
                        label: 'Expenses by Category',
                        data: expensesByCategory.map(c => c.total),
                        backgroundColor: chartColors,
                        borderColor: '#fff',
                        borderWidth: 2,
                    }]
                },
                options: { responsive: true, plugins: { legend: { position: 'top' }, title: { display: true, text: 'Approved Spending by Category', font: { size: 16 } } } }
            });
        }

        if (projectChartRef.current) {
            const ctx = projectChartRef.current.getContext('2d');
            const expensesByProject = projects.map(project => {
                const total = expenses
                    .filter(e => e.projectId === project.id && e.status === Status.APPROVED)
                    .reduce((sum, e) => sum + e.amount, 0);
                return { name: project.name, total };
            }).filter(p => p.total > 0);

            projectChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: expensesByProject.map(p => p.name),
                    datasets: [{
                        label: 'Expenses by Project',
                        data: expensesByProject.map(p => p.total),
                         backgroundColor: chartColors.slice().reverse(),
                         borderColor: '#fff',
                         borderWidth: 2,
                    }]
                },
                options: { responsive: true, plugins: { legend: { position: 'top' }, title: { display: true, text: 'Approved Spending by Project', font: {size: 16} } } }
            });
        }
        
        if (monthlyChartRef.current) {
            const ctx = monthlyChartRef.current.getContext('2d');
            const monthlyData: { [key: string]: number } = {};
            expenses.forEach(expense => {
                if (expense.status === Status.APPROVED) {
                    const month = new Date(expense.submittedAt).toLocaleString('default', { month: 'short', year: '2-digit' });
                    if (!monthlyData[month]) monthlyData[month] = 0;
                    monthlyData[month] += expense.amount;
                }
            });

            // Ensure we have sorted labels
            const sortedMonths = Object.keys(monthlyData).sort((a,b) => {
                const [monthA, yearA] = a.split(' ');
                const [monthB, yearB] = b.split(' ');
                const dateA = new Date(`01 ${monthA} 20${yearA}`);
                const dateB = new Date(`01 ${monthB} 20${yearB}`);
                return dateA.getTime() - dateB.getTime();
            });

            monthlyChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: sortedMonths,
                    datasets: [{
                        label: 'Total Approved Amount (₹)',
                        data: sortedMonths.map(month => monthlyData[month]),
                        backgroundColor: '#6366f1',
                        borderRadius: 4,
                    }]
                },
                options: {
                    responsive: true,
                    plugins: { legend: { display: false }, title: { display: true, text: 'Monthly Spending Trend', font: {size: 16} } },
                    scales: { y: { beginAtZero: true } }
                }
            });
        }


        return () => {
            if (categoryChart) categoryChart.destroy();
            if (projectChart) projectChart.destroy();
            if (monthlyChart) monthlyChart.destroy();
        };
    }, [expenses, categories, projects]);

    return (
        <div>
            <h2 className="text-2xl font-bold tracking-tight text-neutral-900">Reports & Analytics</h2>
            <p className="mt-1 text-sm text-neutral-600">Visualize spending patterns and gain insights into expense data.</p>
            
            <div className="grid grid-cols-1 gap-8 mt-6 lg:grid-cols-2">
                <div className="p-6 bg-white rounded-xl shadow-lg">
                    <canvas ref={categoryChartRef}></canvas>
                </div>
                <div className="p-6 bg-white rounded-xl shadow-lg">
                    <canvas ref={projectChartRef}></canvas>
                </div>
            </div>
            <div className="p-6 mt-8 bg-white rounded-xl shadow-lg">
                 <canvas ref={monthlyChartRef}></canvas>
            </div>
        </div>
    );
};

export default ReportsDashboard;