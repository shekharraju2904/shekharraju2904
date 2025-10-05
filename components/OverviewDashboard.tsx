import React, { useState, useEffect, useRef } from 'react';
import { Expense, Category, Status, Project, Site, Subcategory } from '../types';
import { PlusIcon, CheckCircleIcon, XCircleIcon, Hourglass } from './Icons';

declare const Chart: any;

interface OverviewDashboardProps {
  expenses: Expense[];
  categories: Category[];
  projects: Project[];
  sites: Site[];
}

const AnimatedCounter: React.FC<{ end: number, duration?: number, isCurrency?: boolean }> = ({ end, duration = 1500, isCurrency = false }) => {
    const [count, setCount] = useState(0);
    const frameRate = 1000 / 60;
    const totalFrames = Math.round(duration / frameRate);

    useEffect(() => {
        let frame = 0;
        const counter = setInterval(() => {
            frame++;
            const progress = frame / totalFrames;
            const currentCount = Math.round(end * progress);
            setCount(currentCount);

            if (frame === totalFrames) {
                clearInterval(counter);
                setCount(end); 
            }
        }, frameRate);

        return () => clearInterval(counter);
    }, [end, duration, totalFrames, frameRate]);

    const formattedValue = isCurrency ? `₹${count.toLocaleString('en-IN')}` : count.toLocaleString('en-IN');
    return <>{formattedValue}</>;
};

const StatCard: React.FC<{ title: string; value: number; isCurrency?: boolean }> = ({ title, value, isCurrency = false }) => (
    <div className="p-6 bg-neutral-900/50 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl">
        <dt className="text-sm font-medium text-neutral-400 truncate">{title}</dt>
        <dd className="mt-1 text-3xl font-semibold tracking-tight text-neutral-50">
           <AnimatedCounter end={value} isCurrency={isCurrency} />
        </dd>
    </div>
);

const OverviewDashboard: React.FC<OverviewDashboardProps> = ({ expenses, categories, projects, sites }) => {
    const categoryChartRef = useRef<HTMLCanvasElement>(null);
    const monthlyChartRef = useRef<HTMLCanvasElement>(null);

    const chartColors = ['#3B82F6', '#14B8A6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#64748B'];

    useEffect(() => {
        let categoryChart: any;
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
                type: 'doughnut',
                data: {
                    labels: expensesByCategory.map(c => c.name),
                    datasets: [{
                        data: expensesByCategory.map(c => c.total),
                        backgroundColor: chartColors,
                        borderColor: '#0F172A',
                        borderWidth: 4,
                        hoverOffset: 8
                    }]
                },
                options: { 
                    responsive: true, 
                    cutout: '70%',
                    plugins: { 
                        legend: { position: 'right', labels: { boxWidth: 12, padding: 15 } }, 
                        title: { display: true, text: 'Approved Spending by Category', font: { size: 16 }, color: '#F8FAFC', padding: { bottom: 20 } } 
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
            if (monthlyChart) monthlyChart.destroy();
        };
    }, [expenses, categories]);


    const totalAmount = expenses.reduce((acc, exp) => acc + exp.amount, 0);
    const pendingCount = expenses.filter(e => e.status === Status.PENDING_APPROVAL || e.status === Status.PENDING_VERIFICATION).length;
    const approvedCount = expenses.filter(e => e.status === Status.APPROVED).length;
    const rejectedCount = expenses.filter(e => e.status === Status.REJECTED).length;

    const recentExpenses = [...expenses].sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()).slice(0, 5);
    const getProjectName = (id: string) => projects.find(p => p.id === id)?.name || 'Unknown';

    const StatusIcon = ({ status }: { status: Status }) => {
         const styles = {
          [Status.APPROVED]: 'bg-success/20 text-success',
          [Status.REJECTED]: 'bg-accent-danger/20 text-accent-danger',
          [Status.PENDING_APPROVAL]: 'bg-accent/20 text-accent',
          [Status.PENDING_VERIFICATION]: 'bg-primary/20 text-primary-light',
        };
        const icons = {
            [Status.APPROVED]: <CheckCircleIcon />,
            [Status.REJECTED]: <XCircleIcon />,
            [Status.PENDING_APPROVAL]: <Hourglass />,
            [Status.PENDING_VERIFICATION]: <Hourglass />,
        };
        const style = styles[status] || 'bg-neutral-500/20 text-neutral-300';
        return <div className={`flex items-center justify-center w-10 h-10 rounded-full ${style}`}>{icons[status]}</div>;
    };


    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-neutral-50">Overview</h1>
                <p className="mt-1 text-neutral-400">A summary of all expense activities in the system.</p>
            </div>
            
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard title="Total Expenses" value={expenses.length} />
                <StatCard title="Total Value" value={totalAmount} isCurrency />
                <StatCard title="Pending Requests" value={pendingCount} />
                <StatCard title="Approved / Rejected" value={approvedCount} />
            </div>

             <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
                 <div className="lg:col-span-3 p-6 bg-neutral-900/50 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl">
                     <canvas ref={monthlyChartRef}></canvas>
                </div>
                <div className="lg:col-span-2 p-6 bg-neutral-900/50 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl">
                    <canvas ref={categoryChartRef}></canvas>
                </div>
            </div>

            <div className="p-6 bg-neutral-900/50 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl">
                <h3 className="text-lg font-semibold text-neutral-100">Recent Activity</h3>
                <div className="flow-root mt-6">
                    {recentExpenses.length > 0 ? (
                    <ul className="-my-5">
                        {recentExpenses.map((expense, index) => (
                        <li key={expense.id} className="py-5">
                            <div className="relative">
                                {index !== recentExpenses.length -1 && <span className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-neutral-700" aria-hidden="true" />}
                                <div className="relative flex items-start space-x-3">
                                    <div>
                                        <StatusIcon status={expense.status} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div>
                                            <div className="text-sm">
                                                <span className="font-medium text-neutral-100">{expense.requestorName}</span>
                                                <span className="text-neutral-400"> submitted a request</span>
                                            </div>
                                            <p className="mt-0.5 text-sm text-neutral-500">
                                                On {new Date(expense.submittedAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div className="mt-2 text-sm text-neutral-300">
                                            <p>
                                               <span className="font-mono text-primary-light">{expense.referenceNumber}</span> for project <span className="font-semibold">{getProjectName(expense.projectId)}</span>
                                            </p>
                                        </div>
                                    </div>
                                     <div className="text-right text-sm whitespace-nowrap text-neutral-300">
                                        <span className="font-semibold text-lg">₹{expense.amount.toLocaleString('en-IN')}</span>
                                    </div>
                                </div>
                            </div>
                        </li>
                        ))}
                    </ul>
                    ) : (
                         <div className="py-8 text-center border-2 border-dashed rounded-lg border-neutral-700">
                            <p className="text-sm text-neutral-400">No expense activity to show.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OverviewDashboard;