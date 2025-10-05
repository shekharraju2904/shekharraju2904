import React from 'react';
import { User, Role } from '../types';
import { LayoutDashboard, Wallet, Landmark, BarChart, UserCircle, Settings, LogOut, LogoIcon, PlusIcon } from './Icons';
import Avatar from './Avatar';

interface SideNavProps {
    user: User;
    onLogout: () => void;
    activeView: string;
    setActiveView: (view: string) => void;
    onNewExpenseClick: () => void;
}

const NavItem: React.FC<{
    icon: React.ReactNode;
    label: string;
    viewName: string;
    activeView: string;
    onClick: () => void;
}> = ({ icon, label, viewName, activeView, onClick }) => {
    const isActive = activeView === viewName;
    return (
        <li>
            <a
                href="#"
                onClick={(e) => { e.preventDefault(); onClick(); }}
                className={`group flex items-center justify-center lg:justify-start gap-3 rounded-lg p-3 transition-all duration-200 ${
                    isActive
                        ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-lg shadow-primary/30'
                        : 'text-neutral-400 hover:bg-white/10 hover:text-white'
                }`}
            >
                <div className={`transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>{icon}</div>
                <span className="text-sm font-semibold hidden lg:block">{label}</span>
            </a>
        </li>
    );
};

const SideNav: React.FC<SideNavProps> = ({ user, onLogout, activeView, setActiveView, onNewExpenseClick }) => {

    const getRoleSpecificTaskInfo = () => {
        switch (user.role) {
            case Role.REQUESTOR: return { icon: <Wallet size={24} />, label: 'My Expenses' };
            case Role.VERIFIER: return { icon: <Wallet size={24} />, label: 'Verification' };
            case Role.APPROVER: return { icon: <Wallet size={24} />, label: 'Approval' };
            default: return { icon: <Wallet size={24} />, label: 'My Tasks' };
        }
    };
    const taskInfo = getRoleSpecificTaskInfo();

    const navItems = [
        { view: 'overview', icon: <LayoutDashboard size={24} />, label: 'Overview' },
        { view: 'tasks', icon: taskInfo.icon, label: taskInfo.label },
        { view: 'all_transactions', icon: <Landmark size={24} />, label: 'Transactions' },
        { view: 'reports', icon: <BarChart size={24} />, label: 'Reports' },
        { view: 'profile', icon: <UserCircle size={24} />, label: 'Profile' },
    ];
    if (user.role === Role.ADMIN) {
        navItems.push({ view: 'admin', icon: <Settings size={24} />, label: 'Admin Panel' });
    }

    const navigationContent = (
        <>
            {navItems.map(item => (
                <NavItem
                    key={item.view}
                    viewName={item.view}
                    icon={item.icon}
                    label={item.label}
                    activeView={activeView}
                    onClick={() => setActiveView(item.view)}
                />
            ))}
        </>
    );

    return (
        <>
            {/* Desktop Sidebar */}
            <aside className="hidden md:flex flex-col w-20 lg:w-64 h-screen p-4 bg-neutral-900/50 backdrop-blur-xl border-r border-white/10 text-white fixed z-40">
                <div className="flex items-center gap-3 mb-8 px-2">
                    <div className="p-1.5 rounded-lg bg-gradient-to-br from-primary to-secondary">
                        <LogoIcon className="w-8 h-8 text-white" />
                    </div>
                    <span className="text-xl font-bold hidden lg:block">ExpenseFlow</span>
                </div>

                <div className="px-0 lg:px-2 mb-4">
                     <button
                        onClick={onNewExpenseClick}
                        className="w-full group flex items-center justify-center lg:justify-start gap-3 rounded-lg p-3 transition-all duration-200 bg-gradient-to-r from-primary to-secondary text-white shadow-lg shadow-primary/30 hover:scale-105"
                    >
                        <PlusIcon size={24} />
                        <span className="text-sm font-semibold hidden lg:block">New Expense</span>
                    </button>
                </div>
                
                <ul className="flex-1 space-y-2">
                    {navigationContent}
                </ul>
                <div className="border-t border-white/10 pt-4">
                    <div className="flex items-center gap-3 p-2">
                        <Avatar name={user.name} />
                        <div className="hidden lg:block">
                            <p className="text-sm font-semibold">{user.name}</p>
                            <p className="text-xs text-neutral-400 capitalize">{user.role}</p>
                        </div>
                        <button onClick={onLogout} className="p-2 ml-auto text-neutral-400 rounded-md hover:bg-white/10 hover:text-white hidden lg:block" title="Logout">
                            <LogOut size={20} />
                        </button>
                    </div>
                </div>
            </aside>
            
            {/* Mobile Bottom Bar */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 h-20 bg-neutral-900/80 backdrop-blur-xl border-t border-white/10 z-50">
                <ul className="flex justify-around items-center h-full px-2">
                    {navItems.slice(0, 4).map(item => ( // Show first 4 main items
                         <li key={item.view}>
                            <a
                                href="#"
                                onClick={(e) => { e.preventDefault(); setActiveView(item.view); }}
                                className={`flex flex-col items-center justify-center p-2 rounded-lg w-16 transition-all duration-200 ${
                                    activeView === item.view
                                        ? 'text-primary'
                                        : 'text-neutral-400 hover:bg-white/10'
                                }`}
                            >
                                {item.icon}
                                <span className="text-xs mt-1 text-center">{item.label}</span>
                            </a>
                        </li>
                    ))}
                     <li>
                        <button
                            onClick={onNewExpenseClick}
                            className="flex flex-col items-center justify-center p-2 rounded-full w-16 h-16 text-white bg-gradient-to-r from-primary to-secondary -translate-y-4 shadow-lg"
                        >
                            <PlusIcon size={28} />
                        </button>
                    </li>
                </ul>
            </nav>
        </>
    );
};

export default SideNav;