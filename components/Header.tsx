import React, { useState, useEffect, useRef } from 'react';
import { User, Expense, Category, Project, Site, Role } from '../types';
import Avatar from './Avatar';
import { SearchIcon } from './Icons';

interface HeaderProps {
  user: User;
  onLogout: () => void;
  expenses: Expense[];
  categories: Category[];
  projects: Project[];
  sites: Site[];
  onSelectExpense: (expense: Expense) => void;
  onSelectAdminItem: (itemType: 'category' | 'project' | 'site') => void;
}

const useDebounce = (value: string, delay: number) => {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);
    return debouncedValue;
};

interface SearchResults {
  expenses: Expense[];
  categories: Category[];
  projects: Project[];
  sites: Site[];
}


const Header: React.FC<HeaderProps> = ({ user, onLogout, expenses, categories, projects, sites, onSelectExpense, onSelectAdminItem }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<SearchResults>({ expenses: [], categories: [], projects: [], sites: [] });
  const [isResultsVisible, setResultsVisible] = useState(false);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (debouncedSearchTerm) {
        const lowercasedTerm = debouncedSearchTerm.toLowerCase();
        
        const filteredExpenses = expenses.filter(expense => {
            const category = categories.find(c => c.id === expense.categoryId);
            const categoryName = category?.name || '';
            const subcategoryName = category?.subcategories?.find(sc => sc.id === expense.subcategoryId)?.name || '';
            const projectName = projects.find(p => p.id === expense.projectId)?.name || '';

            return (
            expense.referenceNumber.toLowerCase().includes(lowercasedTerm) ||
            expense.requestorName.toLowerCase().includes(lowercasedTerm) ||
            expense.description.toLowerCase().includes(lowercasedTerm) ||
            categoryName.toLowerCase().includes(lowercasedTerm) ||
            subcategoryName.toLowerCase().includes(lowercasedTerm) ||
            projectName.toLowerCase().includes(lowercasedTerm) ||
            expense.status.toLowerCase().includes(lowercasedTerm)
            );
        });

        let filteredCategories: Category[] = [];
        let filteredProjects: Project[] = [];
        let filteredSites: Site[] = [];

        if (user.role === Role.ADMIN) {
            filteredCategories = categories.filter(category => 
                category.name.toLowerCase().includes(lowercasedTerm)
            );
            filteredProjects = projects.filter(project => 
                project.name.toLowerCase().includes(lowercasedTerm)
            );
            filteredSites = sites.filter(site => 
                site.name.toLowerCase().includes(lowercasedTerm)
            );
        }

        setResults({
            expenses: filteredExpenses,
            categories: filteredCategories,
            projects: filteredProjects,
            sites: filteredSites,
        });
        setResultsVisible(true);
    } else {
        setResults({ expenses: [], categories: [], projects: [], sites: [] });
        setResultsVisible(false);
    }
  }, [debouncedSearchTerm, expenses, categories, projects, sites, user.role]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setResultsVisible(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleResultClick = (item: Expense | Category | Project | Site, type: 'expense' | 'category' | 'project' | 'site') => {
    if (type === 'expense') {
        onSelectExpense(item as Expense);
    } else {
        onSelectAdminItem(type);
    }
    setSearchTerm('');
    setResultsVisible(false);
  };

  const ResultItem: React.FC<{onClick: () => void, children: React.ReactNode}> = ({ onClick, children }) => (
    <li onClick={onClick} className="px-4 py-3 cursor-pointer hover:bg-gray-50">
        {children}
    </li>
  );

  const ResultSection: React.FC<{title: string}> = ({ title }) => (
    <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase bg-gray-50 tracking-wider">{title}</div>
  );
  
  const totalResults = results.expenses.length + results.categories.length + results.projects.length + results.sites.length;

  return (
    <header className="bg-white shadow-sm">
      <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <h1 className="text-xl font-bold text-primary">ExpenseFlow</h1>
            <div className="relative" ref={searchContainerRef}>
              <div className="relative">
                 <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <SearchIcon className="w-5 h-5 text-gray-400" />
                </div>
                <input
                    type="text"
                    placeholder="Search expenses, projects..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full py-2 pl-10 pr-3 border border-gray-300 rounded-md bg-neutral-100 focus:outline-none focus:ring-primary-focus focus:border-primary-focus sm:text-sm"
                />
              </div>
              {isResultsVisible && (
                  <div className="absolute z-20 w-96 mt-1 overflow-hidden bg-white border border-gray-200 rounded-md shadow-lg max-h-96">
                    <ul className="overflow-y-auto divide-y divide-gray-200">
                        {totalResults > 0 ? (
                            <>
                                {results.expenses.length > 0 && (
                                    <>
                                        <ResultSection title="Expenses" />
                                        {results.expenses.map(expense => (
                                            <ResultItem key={`exp-${expense.id}`} onClick={() => handleResultClick(expense, 'expense')}>
                                                <p className="text-sm font-medium text-gray-900 truncate"><span className="font-mono">{expense.referenceNumber}</span></p>
                                                <p className="text-sm text-gray-500 truncate">{expense.requestorName} - ₹{expense.amount.toLocaleString('en-IN')}</p>
                                            </ResultItem>
                                        ))}
                                    </>
                                )}
                                {results.categories.length > 0 && (
                                     <>
                                        <ResultSection title="Categories" />
                                        {results.categories.map(category => (
                                            <ResultItem key={`cat-${category.id}`} onClick={() => handleResultClick(category, 'category')}>
                                                <p className="text-sm font-medium text-gray-900 truncate">{category.name}</p>
                                            </ResultItem>
                                        ))}
                                    </>
                                )}
                                {results.projects.length > 0 && (
                                     <>
                                        <ResultSection title="Projects" />
                                        {results.projects.map(project => (
                                            <ResultItem key={`proj-${project.id}`} onClick={() => handleResultClick(project, 'project')}>
                                                <p className="text-sm font-medium text-gray-900 truncate">{project.name}</p>
                                            </ResultItem>
                                        ))}
                                    </>
                                )}
                                {results.sites.length > 0 && (
                                     <>
                                        <ResultSection title="Sites" />
                                        {results.sites.map(site => (
                                            <ResultItem key={`site-${site.id}`} onClick={() => handleResultClick(site, 'site')}>
                                                <p className="text-sm font-medium text-gray-900 truncate">{site.name}</p>
                                            </ResultItem>
                                        ))}
                                    </>
                                )}
                            </>
                        ) : (
                            <li className="px-4 py-3 text-sm text-center text-gray-500">No results found.</li>
                        )}
                    </ul>
                  </div>
              )}
            </div>
          </div>
          <div className="flex items-center">
            <div className="hidden sm:ml-6 sm:flex sm:items-center">
                <span className="mr-3 text-sm font-medium text-gray-700">Welcome, {user.name}</span>
                <Avatar name={user.name} />
                <button
                    onClick={onLogout}
                    className="ml-4 px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 border border-transparent rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                    Logout
                </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;