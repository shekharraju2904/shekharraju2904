import React, { useState } from 'react';
import { User, Category, Role, Subcategory, AuditLogItem, Project, Site, Expense } from '../types';
import { PencilIcon, TrashIcon, PlusIcon, KeyIcon, BanIcon, CheckCircleIcon, ArrowUturnLeftIcon } from './Icons';
import Modal from './Modal';

interface AdminPanelProps {
  users: User[];
  categories: Category[];
  projects: Project[];
  sites: Site[];
  expenses: Expense[];
  deletedExpenses: Expense[];
  auditLog: AuditLogItem[];
  onAddUser: (user: Omit<User, 'id'>) => void;
  onUpdateUser: (user: User) => void;
  onToggleUserStatus: (user: User) => void;
  onResetUserPassword: (userEmail: string, userName: string) => void;
  onAddCategory: (category: Omit<Category, 'id'>) => void;
  onUpdateCategory: (category: Category) => void;
  onDeleteCategory: (categoryId: string) => void;
  onAddSubcategory: (categoryId: string, subcategoryData: Omit<Subcategory, 'id'>) => void;
  onUpdateSubcategory: (categoryId: string, updatedSubcategory: Subcategory) => void;
  onDeleteSubcategory: (categoryId: string, subcategoryId: string) => void;
  onAddProject: (project: Omit<Project, 'id'>) => void;
  onUpdateProject: (project: Project) => void;
  onDeleteProject: (projectId: string) => void;
  onAddSite: (site: Omit<Site, 'id'>) => void;
  onUpdateSite: (site: Site) => void;
  onDeleteSite: (siteId: string) => void;
  activeAdminTab: string;
  setActiveAdminTab: (tabId: string) => void;
  onTriggerBackup: () => void;
  onRestoreExpense: (expenseId: string) => void;
  onPermanentlyDeleteExpense: (expenseId: string) => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({
  users, categories, projects, sites, expenses, deletedExpenses, auditLog,
  onAddUser, onUpdateUser, onToggleUserStatus, onResetUserPassword,
  onAddCategory, onUpdateCategory, onDeleteCategory,
  onAddSubcategory, onUpdateSubcategory, onDeleteSubcategory,
  onAddProject, onUpdateProject, onDeleteProject,
  onAddSite, onUpdateSite, onDeleteSite,
  activeAdminTab, setActiveAdminTab, onTriggerBackup,
  onRestoreExpense, onPermanentlyDeleteExpense
}) => {
  const [isUserModalOpen, setUserModalOpen] = useState(false);
  const [isCategoryModalOpen, setCategoryModalOpen] = useState(false);
  const [isSubcategoryModalOpen, setSubcategoryModalOpen] = useState(false);
  const [isProjectModalOpen, setProjectModalOpen] = useState(false);
  const [isSiteModalOpen, setSiteModalOpen] = useState(false);
  
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingSubcategory, setEditingSubcategory] = useState<{ subcategory: Subcategory, categoryId: string } | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editingSite, setEditingSite] = useState<Site | null>(null);

  const handleOpenUserModal = (user: User | null = null) => {
    setEditingUser(user);
    setUserModalOpen(true);
  };

  const handleOpenCategoryModal = (category: Category | null = null) => {
    setEditingCategory(category);
    setCategoryModalOpen(true);
  };

  const handleOpenSubcategoryModal = (subcategory: Subcategory | null = null, categoryId: string | null = null) => {
    setEditingSubcategory(subcategory && categoryId ? { subcategory, categoryId } : null);
    setSubcategoryModalOpen(true);
  };

  const handleOpenProjectModal = (project: Project | null = null) => {
    setEditingProject(project);
    setProjectModalOpen(true);
  };
  
  const handleOpenSiteModal = (site: Site | null = null) => {
    setEditingSite(site);
    setSiteModalOpen(true);
  };
  
  const handleUserFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const username = formData.get('username') as string;
    const role = formData.get('role') as Role;

    if (editingUser) {
        const userToUpdate: User = { ...editingUser, name, username, role, };
        onUpdateUser(userToUpdate);
    }
    setUserModalOpen(false);
    setEditingUser(null);
  }

  const handleCategoryFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      const categoryData = {
          name: formData.get('name') as string,
          attachmentRequired: (formData.get('attachmentRequired') === 'on'),
          autoApproveAmount: Number(formData.get('autoApproveAmount')),
      };

      if (editingCategory) { onUpdateCategory({ ...editingCategory, ...categoryData }); } 
      else { onAddCategory(categoryData); }
      setCategoryModalOpen(false);
      setEditingCategory(null);
  }

  const handleSubcategoryFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const subcategoryData = {
        name: formData.get('name') as string,
        attachmentRequired: (formData.get('attachmentRequired') === 'on'),
    };
    const categoryId = formData.get('categoryId') as string;

    if (editingSubcategory) { onUpdateSubcategory(categoryId, { ...editingSubcategory.subcategory, ...subcategoryData });} 
    else { onAddSubcategory(categoryId, subcategoryData); }
    setSubcategoryModalOpen(false);
    setEditingSubcategory(null);
  }

  const handleProjectFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const projectData = { name: formData.get('name') as string };
    if (editingProject) { onUpdateProject({ ...editingProject, ...projectData }); } 
    else { onAddProject(projectData); }
    setProjectModalOpen(false);
    setEditingProject(null);
  };

  const handleSiteFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const siteData = { name: formData.get('name') as string };
    if (editingSite) { onUpdateSite({ ...editingSite, ...siteData }); } 
    else { onAddSite(siteData); }
    setSiteModalOpen(false);
    setEditingSite(null);
  };

  const handleDeleteCategory = (category: Category) => {
      if (expenses.some(e => e.categoryId === category.id)) {
          alert(`Cannot delete category "${category.name}". It is associated with existing expenses.`); return;
      }
      if (window.confirm(`Delete category "${category.name}" and all its subcategories? This cannot be undone.`)) { onDeleteCategory(category.id); }
  };

  const handleDeleteProject = (project: Project) => {
      if (expenses.some(e => e.projectId === project.id)) {
          alert(`Cannot delete project "${project.name}". It is associated with existing expenses.`); return;
      }
      if (window.confirm(`Delete project "${project.name}"? This cannot be undone.`)) { onDeleteProject(project.id); }
  };

  const handleDeleteSite = (site: Site) => {
      if (expenses.some(e => e.siteId === site.id)) {
          alert(`Cannot delete site "${site.name}". It is associated with existing expenses.`); return;
      }
      if (window.confirm(`Delete site "${site.name}"? This cannot be undone.`)) { onDeleteSite(site.id); }
  };

  const formatDateTime = (isoString: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
  };
  
  const getUserNameById = (id: string | undefined) => users.find(u => u.id === id)?.name || 'Unknown User';

  const TabButton = ({ tabId, label }: { tabId: string, label: string }) => (
     <button
        onClick={() => setActiveAdminTab(tabId)}
        className={`${activeAdminTab === tabId ? 'border-b-2 border-secondary text-white' : 'border-transparent text-neutral-400 hover:text-neutral-200 hover:border-neutral-500'} whitespace-nowrap py-3 px-4 font-medium text-sm transition-colors duration-200`}
      >
        {label}
      </button>
  );

  const formInputStyle = "relative block w-full px-4 py-3 bg-neutral-900/50 border border-neutral-700 text-neutral-50 placeholder-neutral-400 rounded-md appearance-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm";
  const formSelectStyle = `${formInputStyle} pr-10`;
  const formLabelStyle = "block text-sm font-medium text-neutral-300";
  const modalButtonStyle = "px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-primary to-secondary rounded-md hover:opacity-90 transition-opacity";
  const modalCancelButtonStyle = "px-4 py-2 text-sm font-semibold text-neutral-200 bg-neutral-800/50 border border-neutral-700 rounded-md hover:bg-neutral-700/50 transition-colors";

  const renderContent = () => {
    const tableContainerClass = "-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8";
    const tableWrapperClass = "inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8";
    const tableClass = "min-w-full";
    const tableHeadClass = "border-b border-white/10";
    const tableThClass = "py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-neutral-100 sm:pl-0";
    const tableBodyClass = "divide-y divide-white/5";
    const tableRowClass = "transition-colors duration-200 hover:bg-white/5";
    const tableTdClass = "px-3 py-4 text-sm text-neutral-400 whitespace-nowrap";

    switch (activeAdminTab) {
      case 'users':
        return (
          <div className="p-6 bg-neutral-900/50 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl">
            <h3 className="text-base font-semibold text-neutral-100">Users</h3>
            <p className="mt-1 text-sm text-neutral-400">A list of all the users in the system. New users must sign up themselves.</p>
            <div className="flow-root mt-6">
              <div className={tableContainerClass}>
                <div className={tableWrapperClass}>
                  <table className={tableClass}>
                    <thead className={tableHeadClass}>
                      <tr>
                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-neutral-100 sm:pl-0">Name</th>
                        <th scope="col" className={tableTdClass}>Username</th>
                        <th scope="col" className={tableTdClass}>Email</th>
                        <th scope="col" className={tableTdClass}>Role</th>
                        <th scope="col" className={tableTdClass}>Status</th>
                        <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-0"><span className="sr-only">Actions</span></th>
                      </tr>
                    </thead>
                    <tbody className={tableBodyClass}>
                      {users.map((user) => (
                        <tr key={user.id} className={tableRowClass}>
                          <td className="py-4 pl-4 pr-3 text-sm font-medium text-neutral-100 whitespace-nowrap sm:pl-0">{user.name}</td>
                          <td className={tableTdClass}>{user.username}</td>
                          <td className={tableTdClass}>{user.email}</td>
                          <td className={`${tableTdClass} capitalize`}>{user.role}</td>
                          <td className={tableTdClass}>
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.status === 'active' ? 'bg-success/20 text-success' : 'bg-accent-danger/20 text-accent-danger'}`}>{user.status}</span>
                          </td>
                          <td className="relative flex items-center justify-end py-4 pl-3 pr-4 space-x-4 text-sm font-medium text-right whitespace-nowrap sm:pr-0">
                            <button onClick={() => onResetUserPassword(user.email, user.name)} className="text-secondary hover:text-secondary/80" title="Send Password Reset"><KeyIcon className="w-5 h-5" /></button>
                            <button onClick={() => handleOpenUserModal(user)} className="text-primary-light hover:text-primary-light/80" title="Edit User"><PencilIcon className="w-5 h-5" /></button>
                            <button onClick={() => onToggleUserStatus(user)} className={user.status === 'active' ? 'text-accent-danger hover:text-accent-danger/80' : 'text-success hover:text-success/80'} title={user.status === 'active' ? 'Disable User' : 'Enable User'}>
                              {user.status === 'active' ? <BanIcon className="w-5 h-5" /> : <CheckCircleIcon className="w-5 h-5" />}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )
      // Other cases would follow a similar structure...
       case 'categories':
        return (
          <div className="p-6 bg-neutral-900/50 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl">
            <div className="sm:flex sm:items-center">
              <div className="sm:flex-auto">
                <h3 className="text-base font-semibold text-neutral-100">Categories</h3>
                <p className="mt-1 text-sm text-neutral-400">Manage expense categories and approval rules.</p>
              </div>
              <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
                <button onClick={() => handleOpenCategoryModal()} type="button" className={modalButtonStyle}>
                    <PlusIcon className="w-5 h-5 mr-2" /> Add category
                </button>
              </div>
            </div>
             <div className="flow-root mt-6">
              <div className={tableContainerClass}>
                <div className={tableWrapperClass}>
                  <table className={tableClass}>
                    <thead className={tableHeadClass}>
                      <tr>
                        <th scope="col" className={tableThClass}>Name</th>
                        <th scope="col" className={tableThClass}>Subcategories</th>
                        <th scope="col" className={tableThClass}>Attachment Required</th>
                        <th scope="col" className={tableThClass}>Auto-Approve Limit (₹)</th>
                        <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-0"><span className="sr-only">Edit</span></th>
                      </tr>
                    </thead>
                    <tbody className={tableBodyClass}>
                      {categories.map((cat) => (
                        <tr key={cat.id} className={tableRowClass}>
                          <td className="py-4 pl-4 pr-3 text-sm font-medium text-neutral-100 whitespace-nowrap sm:pl-0">{cat.name}</td>
                          <td className={tableTdClass}>{cat.subcategories?.length || 0}</td>
                          <td className={tableTdClass}>{cat.attachmentRequired ? 'Yes' : 'No'}</td>
                          <td className={tableTdClass}>{cat.autoApproveAmount.toLocaleString('en-IN')}</td>
                          <td className="relative flex justify-end items-center space-x-4 py-4 pl-3 pr-4 text-sm font-medium whitespace-nowrap sm:pr-0">
                            <button onClick={() => handleOpenCategoryModal(cat)} className="text-primary-light hover:text-primary-light/80"><PencilIcon className="w-5 h-5" /></button>
                            <button onClick={() => handleDeleteCategory(cat)} className="text-accent-danger hover:text-accent-danger/80"><TrashIcon className="w-5 h-5" /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )
      case 'subcategories':
        return (
          <div className="p-6 bg-neutral-900/50 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl">
            <div className="sm:flex sm:items-center">
              <div className="sm:flex-auto">
                <h3 className="text-base font-semibold text-neutral-100">Subcategories</h3>
                <p className="mt-1 text-sm text-neutral-400">Manage subcategories for each main expense category.</p>
              </div>
              <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
                <button onClick={() => handleOpenSubcategoryModal()} type="button" className={modalButtonStyle}>
                    <PlusIcon className="w-5 h-5 mr-2" /> Add subcategory
                </button>
              </div>
            </div>
             <div className="flow-root mt-6">
              <div className={tableContainerClass}>
                <div className={tableWrapperClass}>
                  <table className={tableClass}>
                    <thead className={tableHeadClass}>
                      <tr>
                        <th scope="col" className={tableThClass}>Subcategory Name</th>
                        <th scope="col" className={tableThClass}>Parent Category</th>
                        <th scope="col" className={tableThClass}>Attachment Required</th>
                        <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-0"><span className="sr-only">Edit</span></th>
                      </tr>
                    </thead>
                    <tbody className={tableBodyClass}>
                      {categories.flatMap((cat) => (cat.subcategories?.map(subcat => (
                        <tr key={subcat.id} className={tableRowClass}>
                          <td className="py-4 pl-4 pr-3 text-sm font-medium text-neutral-100 whitespace-nowrap sm:pl-0">{subcat.name}</td>
                          <td className={tableTdClass}>{cat.name}</td>
                          <td className={tableTdClass}>{subcat.attachmentRequired ? 'Yes' : 'No'}</td>
                          <td className="relative flex justify-end items-center space-x-4 py-4 pl-3 pr-4 text-sm font-medium whitespace-nowrap sm:pr-0">
                            <button onClick={() => handleOpenSubcategoryModal(subcat, cat.id)} className="text-primary-light hover:text-primary-light/80"><PencilIcon className="w-5 h-5" /></button>
                            <button onClick={() => onDeleteSubcategory(cat.id, subcat.id)} className="text-accent-danger hover:text-accent-danger/80"><TrashIcon className="w-5 h-5" /></button>
                          </td>
                        </tr>
                      ))))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )
      case 'projects':
         return (
          <div className="p-6 bg-neutral-900/50 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl">
            <div className="sm:flex sm:items-center">
              <div className="sm:flex-auto">
                <h3 className="text-base font-semibold text-neutral-100">Projects</h3>
                <p className="mt-1 text-sm text-neutral-400">Manage available projects for expense submission.</p>
              </div>
              <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
                <button onClick={() => handleOpenProjectModal()} type="button" className={modalButtonStyle}>
                    <PlusIcon className="w-5 h-5 mr-2" /> Add project
                </button>
              </div>
            </div>
             <div className="flow-root mt-6">
              <div className={tableContainerClass}>
                <div className={tableWrapperClass}>
                  <table className={tableClass}>
                    <thead className={tableHeadClass}>
                      <tr>
                        <th scope="col" className={tableThClass}>Project Name</th>
                        <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-0"><span className="sr-only">Edit</span></th>
                      </tr>
                    </thead>
                    <tbody className={tableBodyClass}>
                      {projects.map((project) => (
                        <tr key={project.id} className={tableRowClass}>
                          <td className="py-4 pl-4 pr-3 text-sm font-medium text-neutral-100 whitespace-nowrap sm:pl-0">{project.name}</td>
                          <td className="relative flex justify-end items-center space-x-4 py-4 pl-3 pr-4 text-sm font-medium whitespace-nowrap sm:pr-0">
                            <button onClick={() => handleOpenProjectModal(project)} className="text-primary-light hover:text-primary-light/80"><PencilIcon className="w-5 h-5" /></button>
                            <button onClick={() => handleDeleteProject(project)} className="text-accent-danger hover:text-accent-danger/80"><TrashIcon className="w-5 h-5" /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )
      case 'sites':
         return (
          <div className="p-6 bg-neutral-900/50 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl">
            <div className="sm:flex sm:items-center">
              <div className="sm:flex-auto">
                <h3 className="text-base font-semibold text-neutral-100">Sites/Places</h3>
                <p className="mt-1 text-sm text-neutral-400">Manage available sites or places for expense submission.</p>
              </div>
              <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
                <button onClick={() => handleOpenSiteModal()} type="button" className={modalButtonStyle}>
                    <PlusIcon className="w-5 h-5 mr-2" /> Add Site/Place
                </button>
              </div>
            </div>
             <div className="flow-root mt-6">
              <div className={tableContainerClass}>
                <div className={tableWrapperClass}>
                  <table className={tableClass}>
                    <thead className={tableHeadClass}>
                      <tr>
                        <th scope="col" className={tableThClass}>Site/Place Name</th>
                        <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-0"><span className="sr-only">Edit</span></th>
                      </tr>
                    </thead>
                    <tbody className={tableBodyClass}>
                      {sites.map((site) => (
                        <tr key={site.id} className={tableRowClass}>
                          <td className="py-4 pl-4 pr-3 text-sm font-medium text-neutral-100 whitespace-nowrap sm:pl-0">{site.name}</td>
                          <td className="relative flex justify-end items-center space-x-4 py-4 pl-3 pr-4 text-sm font-medium whitespace-nowrap sm:pr-0">
                            <button onClick={() => handleOpenSiteModal(site)} className="text-primary-light hover:text-primary-light/80"><PencilIcon className="w-5 h-5" /></button>
                            <button onClick={() => handleDeleteSite(site)} className="text-accent-danger hover:text-accent-danger/80"><TrashIcon className="w-5 h-5" /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )
      case 'audit':
        return (
          <div className="p-6 bg-neutral-900/50 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl">
            <h3 className="text-base font-semibold text-neutral-100">Audit Log</h3>
            <p className="mt-1 text-sm text-neutral-400">A history of all administrative actions performed in the system.</p>
            <div className="flow-root mt-6">
              <div className={tableContainerClass}>
                <div className={tableWrapperClass}>
                  <table className={tableClass}>
                    <thead className={tableHeadClass}>
                      <tr>
                        <th scope="col" className={tableThClass}>Timestamp</th>
                        <th scope="col" className={tableThClass}>Performed By</th>
                        <th scope="col" className={tableThClass}>Action</th>
                        <th scope="col" className={tableThClass}>Details</th>
                      </tr>
                    </thead>
                    <tbody className={tableBodyClass}>
                      {auditLog.map((log) => (
                        <tr key={log.id} className={tableRowClass}>
                          <td className="py-4 pl-4 pr-3 text-sm text-neutral-400 whitespace-nowrap sm:pl-0">{formatDateTime(log.timestamp)}</td>
                          <td className={tableTdClass}>{log.actorName}</td>
                          <td className={`${tableTdClass} font-medium text-neutral-100`}>{log.action}</td>
                          <td className={tableTdClass}>{log.details}</td>
                        </tr>
                      ))}
                      {auditLog.length === 0 && (
                        <tr><td colSpan={4} className="py-8 text-center text-sm text-neutral-500">No audit log entries found.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )
      case 'system':
         return (
          <div className="p-6 bg-neutral-900/50 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl">
            <h3 className="text-base font-semibold text-neutral-100">System Actions</h3>
            <div className="mt-4">
              <div className="p-4 border rounded-xl border-neutral-700">
                <h4 className="font-medium text-neutral-100">Data Backup</h4>
                <p className="mt-1 text-sm text-neutral-400">Generate a full backup of the system data and send it to all administrator email addresses.</p>
                <div className="mt-3">
                  <button onClick={onTriggerBackup} type="button" className={modalButtonStyle}>Trigger Backup Email</button>
                </div>
              </div>
            </div>
          </div>
        )
      case 'recycle_bin':
        return (
          <div className="p-6 bg-neutral-900/50 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl">
            <h3 className="text-base font-semibold text-neutral-100">Recycle Bin</h3>
            <p className="mt-1 text-sm text-neutral-400">Deleted expenses can be restored or permanently deleted.</p>
            <div className="flow-root mt-6">
              <div className={tableContainerClass}>
                <div className={tableWrapperClass}>
                  <table className={tableClass}>
                    <thead className={tableHeadClass}>
                      <tr>
                        <th scope="col" className={tableThClass}>Reference #</th>
                        <th scope="col" className={tableThClass}>Requestor</th>
                        <th scope="col" className={tableThClass}>Amount (₹)</th>
                        <th scope="col" className={tableThClass}>Deleted On</th>
                        <th scope="col" className={tableThClass}>Deleted By</th>
                        <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-0"><span className="sr-only">Actions</span></th>
                      </tr>
                    </thead>
                    <tbody className={tableBodyClass}>
                      {deletedExpenses.map((expense) => (
                        <tr key={expense.id} className={tableRowClass}>
                          <td className="py-4 pl-4 pr-3 text-sm font-mono text-neutral-100 whitespace-nowrap sm:pl-0">{expense.referenceNumber}</td>
                          <td className={tableTdClass}>{expense.requestorName}</td>
                          <td className={tableTdClass}>{expense.amount.toLocaleString('en-IN')}</td>
                          <td className={tableTdClass}>{formatDateTime(expense.deletedAt!)}</td>
                          <td className={tableTdClass}>{getUserNameById(expense.deletedBy)}</td>
                          <td className="relative flex items-center justify-end py-4 pl-3 pr-4 space-x-4 text-sm font-medium text-right whitespace-nowrap sm:pr-0">
                            <button onClick={() => onRestoreExpense(expense.id)} className="text-success hover:text-success/80" title="Restore"><ArrowUturnLeftIcon className="w-5 h-5" /></button>
                            <button onClick={() => onPermanentlyDeleteExpense(expense.id)} className="text-accent-danger hover:text-accent-danger/80" title="Delete Permanently"><TrashIcon className="w-5 h-5" /></button>
                          </td>
                        </tr>
                      ))}
                      {deletedExpenses.length === 0 && (
                        <tr><td colSpan={6} className="py-8 text-center text-sm text-neutral-500">The Recycle Bin is empty.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )
      default: return null
    }
  }


  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-neutral-50">Admin Panel</h2>
        <div className="mt-4 border-b border-white/10">
          <nav className="flex -mb-px space-x-6" aria-label="Tabs">
            <TabButton tabId="users" label="Users" />
            <TabButton tabId="categories" label="Categories" />
            <TabButton tabId="subcategories" label="Subcategories" />
            <TabButton tabId="projects" label="Projects" />
            <TabButton tabId="sites" label="Sites" />
            <TabButton tabId="audit" label="Audit Log" />
            <TabButton tabId="system" label="System" />
            <TabButton tabId="recycle_bin" label="Recycle Bin" />
          </nav>
        </div>
      </div>
      
      {renderContent()}

      <Modal isOpen={isUserModalOpen} onClose={() => setUserModalOpen(false)} title={'Edit User'}>
          <form onSubmit={handleUserFormSubmit} className="space-y-4">
              <div>
                  <label htmlFor="name" className={formLabelStyle}>Full Name</label>
                  <input type="text" name="name" id="name" defaultValue={editingUser?.name || ''} required className={formInputStyle} />
              </div>
              <div>
                  <label htmlFor="username" className={formLabelStyle}>Username</label>
                  <input type="text" name="username" id="username" defaultValue={editingUser?.username || ''} required className={formInputStyle} />
              </div>
               <div>
                  <label htmlFor="email" className={formLabelStyle}>Email (Read-only)</label>
                  <input type="email" name="email" id="email" defaultValue={editingUser?.email || ''} required disabled className={`${formInputStyle} bg-neutral-800/50 cursor-not-allowed`} />
              </div>
               <div>
                  <label htmlFor="role" className={formLabelStyle}>Role</label>
                  <select id="role" name="role" defaultValue={editingUser?.role || Role.REQUESTOR} className={formSelectStyle}>
                      {Object.values(Role).map(role => <option key={role} value={role} className="bg-neutral-900">{role}</option>)}
                  </select>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                  <button type="button" onClick={() => setUserModalOpen(false)} className={modalCancelButtonStyle}>Cancel</button>
                  <button type="submit" className={modalButtonStyle}>Save</button>
              </div>
          </form>
      </Modal>

      <Modal isOpen={isCategoryModalOpen} onClose={() => setCategoryModalOpen(false)} title={editingCategory ? 'Edit Category' : 'Add Category'}>
          <form onSubmit={handleCategoryFormSubmit} className="space-y-4">
              <div>
                  <label htmlFor="cat-name" className={formLabelStyle}>Category Name</label>
                  <input type="text" name="name" id="cat-name" defaultValue={editingCategory?.name || ''} required className={formInputStyle} />
              </div>
              <div>
                  <label htmlFor="autoApproveAmount" className={formLabelStyle}>Auto-Approve Limit (₹)</label>
                  <input type="number" name="autoApproveAmount" id="autoApproveAmount" defaultValue={editingCategory?.autoApproveAmount || 0} required className={formInputStyle} />
              </div>
               <div className="relative flex items-start">
                  <div className="flex items-center h-5">
                      <input id="attachmentRequired" name="attachmentRequired" type="checkbox" defaultChecked={editingCategory?.attachmentRequired || false} className="w-4 h-4 bg-neutral-700 border-neutral-600 rounded text-primary focus:ring-primary" />
                  </div>
                  <div className="ml-3 text-sm">
                      <label htmlFor="attachmentRequired" className="font-medium text-neutral-300">Attachment is mandatory</label>
                  </div>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                  <button type="button" onClick={() => setCategoryModalOpen(false)} className={modalCancelButtonStyle}>Cancel</button>
                  <button type="submit" className={modalButtonStyle}>Save</button>
              </div>
          </form>
      </Modal>

      <Modal isOpen={isSubcategoryModalOpen} onClose={() => setSubcategoryModalOpen(false)} title={editingSubcategory ? 'Edit Subcategory' : 'Add Subcategory'}>
          <form onSubmit={handleSubcategoryFormSubmit} className="space-y-4">
              <div>
                  <label htmlFor="categoryId" className={formLabelStyle}>Parent Category</label>
                  <select id="categoryId" name="categoryId" defaultValue={editingSubcategory?.categoryId || ''} required disabled={!!editingSubcategory} className={`${formSelectStyle} disabled:bg-neutral-800/50`}>
                      <option value="" disabled>Select a category</option>
                      {categories.map(cat => <option key={cat.id} value={cat.id} className="bg-neutral-900">{cat.name}</option>)}
                  </select>
              </div>
              <div>
                  <label htmlFor="sub-cat-name" className={formLabelStyle}>Subcategory Name</label>
                  <input type="text" name="name" id="sub-cat-name" defaultValue={editingSubcategory?.subcategory.name || ''} required className={formInputStyle} />
              </div>
               <div className="relative flex items-start">
                  <div className="flex items-center h-5">
                      <input id="sub-attachmentRequired" name="attachmentRequired" type="checkbox" defaultChecked={editingSubcategory?.subcategory.attachmentRequired || false} className="w-4 h-4 bg-neutral-700 border-neutral-600 rounded text-primary focus:ring-primary" />
                  </div>
                  <div className="ml-3 text-sm">
                      <label htmlFor="sub-attachmentRequired" className="font-medium text-neutral-300">Attachment is mandatory</label>
                  </div>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                  <button type="button" onClick={() => setSubcategoryModalOpen(false)} className={modalCancelButtonStyle}>Cancel</button>
                  <button type="submit" className={modalButtonStyle}>Save</button>
              </div>
          </form>
      </Modal>

      <Modal isOpen={isProjectModalOpen} onClose={() => setProjectModalOpen(false)} title={editingProject ? 'Edit Project' : 'Add Project'}>
          <form onSubmit={handleProjectFormSubmit} className="space-y-4">
              <div>
                  <label htmlFor="project-name" className={formLabelStyle}>Project Name</label>
                  <input type="text" name="name" id="project-name" defaultValue={editingProject?.name || ''} required className={formInputStyle} />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                  <button type="button" onClick={() => setProjectModalOpen(false)} className={modalCancelButtonStyle}>Cancel</button>
                  <button type="submit" className={modalButtonStyle}>Save</button>
              </div>
          </form>
      </Modal>

      <Modal isOpen={isSiteModalOpen} onClose={() => setSiteModalOpen(false)} title={editingSite ? 'Edit Site/Place' : 'Add Site/Place'}>
          <form onSubmit={handleSiteFormSubmit} className="space-y-4">
              <div>
                  <label htmlFor="site-name" className={formLabelStyle}>Site/Place Name</label>
                  <input type="text" name="name" id="site-name" defaultValue={editingSite?.name || ''} required className={formInputStyle} />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                  <button type="button" onClick={() => setSiteModalOpen(false)} className={modalCancelButtonStyle}>Cancel</button>
                  <button type="submit" className={modalButtonStyle}>Save</button>
              </div>
          </form>
      </Modal>

    </div>
  );
};

export default AdminPanel;