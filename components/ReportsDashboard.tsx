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

    const chartColors = ['#3B82F6', '#14B8A6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#64748B', '#0D9488'];

    useEffect(() => {
        let categoryChart: any;
        let projectChart: any;
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
            if (monthlyChart) monthlyChart.destroy();
        };
    }, [expenses, categories, projects]);

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-bold text-neutral-50">Reports & Analytics</h2>
                <p className="mt-1 text-neutral-400">Visualize spending patterns and gain insights into expense data.</p>
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
                 <canvas ref={monthlyChartRef}></canvas>
            </div>
        </div>
    );
};

export default ReportsDashboard;