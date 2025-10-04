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
        // Construct object with only the editable fields, preserving the original email and other data.
        const userToUpdate: User = {
          ...editingUser,
          name,
          username,
          role,
        };
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

      if (editingCategory) {
          onUpdateCategory({ ...editingCategory, ...categoryData });
      } else {
          onAddCategory(categoryData);
      }
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

    if (editingSubcategory) {
        onUpdateSubcategory(categoryId, { ...editingSubcategory.subcategory, ...subcategoryData });
    } else {
        onAddSubcategory(categoryId, subcategoryData);
    }
    setSubcategoryModalOpen(false);
    setEditingSubcategory(null);
  }

  const handleProjectFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const projectData = { name: formData.get('name') as string };
    if (editingProject) {
      onUpdateProject({ ...editingProject, ...projectData });
    } else {
      onAddProject(projectData);
    }
    setProjectModalOpen(false);
    setEditingProject(null);
  };

  const handleSiteFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const siteData = { name: formData.get('name') as string };
    if (editingSite) {
      onUpdateSite({ ...editingSite, ...siteData });
    } else {
      onAddSite(siteData);
    }
    setSiteModalOpen(false);
    setEditingSite(null);
  };

  const handleDeleteCategory = (category: Category) => {
      const isUsed = expenses.some(e => e.categoryId === category.id);
      if (isUsed) {
          alert(`Cannot delete category "${category.name}". It is associated with existing expenses. Please reassign or remove them first.`);
          return;
      }
      if (window.confirm(`Are you sure you want to delete the category "${category.name}" and all its subcategories? This cannot be undone.`)) {
          onDeleteCategory(category.id);
      }
  };

  const handleDeleteProject = (project: Project) => {
      const isUsed = expenses.some(e => e.projectId === project.id);
      if (isUsed) {
          alert(`Cannot delete project "${project.name}". It is associated with existing expenses. Please reassign or remove them first.`);
          return;
      }
      if (window.confirm(`Are you sure you want to delete the project "${project.name}"? This cannot be undone.`)) {
          onDeleteProject(project.id);
      }
  };

  const handleDeleteSite = (site: Site) => {
      const isUsed = expenses.some(e => e.siteId === site.id);
      if (isUsed) {
          alert(`Cannot delete site "${site.name}". It is associated with existing expenses. Please reassign or remove them first.`);
          return;
      }
      if (window.confirm(`Are you sure you want to delete the site "${site.name}"? This cannot be undone.`)) {
          onDeleteSite(site.id);
      }
  };

  const formatDateTime = (isoString: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };
  
  const getUserNameById = (id: string | undefined) => {
    if (!id) return 'N/A';
    return users.find(u => u.id === id)?.name || 'Unknown User';
  };

  const TabButton = ({ tabId, label }: { tabId: string, label: string }) => (
     <button
        onClick={() => setActiveAdminTab(tabId)}
        className={`${activeAdminTab === tabId ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} relative whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
      >
        {label}
      </button>
  );

  return (
    <div>
      <h2 className="text-2xl font-bold tracking-tight text-gray-900">Admin Panel</h2>
      <div className="mt-4 border-b border-gray-200">
        <nav className="flex -mb-px space-x-8" aria-label="Tabs">
          <TabButton tabId="users" label="User Management" />
          <TabButton tabId="categories" label="Category Management" />
          <TabButton tabId="subcategories" label="Subcategory Management" />
          <TabButton tabId="projects" label="Project Management" />
          <TabButton tabId="sites" label="Site Management" />
          <TabButton tabId="audit" label="Audit Log" />
          <TabButton tabId="system" label="System" />
          <TabButton tabId="recycle_bin" label="Recycle Bin" />
        </nav>
      </div>

      <div className="mt-8">
        {activeAdminTab === 'users' && (
          <div>
            <div className="sm:flex sm:items-center">
              <div className="sm:flex-auto">
                <h3 className="text-base font-semibold leading-6 text-gray-900">Users</h3>
                <p className="mt-2 text-sm text-gray-700">A list of all the users in the system. New users must sign up themselves.</p>
              </div>
            </div>
            <div className="flow-root mt-8">
                <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                    <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                            <table className="min-w-full bg-white divide-y divide-gray-300">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Name</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Username</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Email</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Role</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                                        <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6"><span className="sr-only">Actions</span></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {users.map((user) => (
                                        <tr key={user.id}>
                                            <td className="py-4 pl-4 pr-3 text-sm font-medium text-gray-900 whitespace-nowrap sm:pl-6">{user.name}</td>
                                            <td className="px-3 py-4 text-sm text-gray-500 whitespace-nowrap">{user.username}</td>
                                            <td className="px-3 py-4 text-sm text-gray-500 whitespace-nowrap">{user.email}</td>
                                            <td className="px-3 py-4 text-sm text-gray-500 whitespace-nowrap capitalize">{user.role}</td>
                                            <td className="px-3 py-4 text-sm text-gray-500 whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                    {user.status}
                                                </span>
                                            </td>
                                            <td className="relative flex items-center justify-end py-4 pl-3 pr-4 space-x-4 text-sm font-medium text-right whitespace-nowrap sm:pr-6">
                                                <button onClick={() => onResetUserPassword(user.email, user.name)} className="text-secondary hover:text-green-700" title="Send Password Reset">
                                                    <KeyIcon className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleOpenUserModal(user)} className="text-primary hover:text-primary-hover" title="Edit User"><PencilIcon className="w-4 h-4" /></button>
                                                <button onClick={() => onToggleUserStatus(user)} className={user.status === 'active' ? 'text-red-600 hover:text-red-800' : 'text-green-600 hover:text-green-800'} title={user.status === 'active' ? 'Disable User' : 'Enable User'}>
                                                    {user.status === 'active' ? <BanIcon className="w-4 h-4" /> : <CheckCircleIcon className="w-4 h-4" />}
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
          </div>
        )}
        
        {activeAdminTab === 'categories' && (
           <div>
            <div className="sm:flex sm:items-center">
              <div className="sm:flex-auto">
                <h3 className="text-base font-semibold leading-6 text-gray-900">Categories</h3>
                <p className="mt-2 text-sm text-gray-700">Manage expense categories and approval rules.</p>
              </div>
              <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
                <button onClick={() => handleOpenCategoryModal()} type="button" className="inline-flex items-center px-3 py-2 text-sm font-semibold text-white rounded-md shadow-sm bg-primary hover:bg-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
                    <PlusIcon className="w-5 h-5 mr-2" /> Add category
                </button>
              </div>
            </div>
            <div className="flow-root mt-8">
                <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                    <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                            <table className="min-w-full bg-white divide-y divide-gray-300">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Name</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Subcategories</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Attachment Required</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Auto-Approve Limit (₹)</th>
                                        <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6"><span className="sr-only">Edit</span></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {categories.map((cat) => (
                                        <tr key={cat.id}>
                                            <td className="py-4 pl-4 pr-3 text-sm font-medium text-gray-900 whitespace-nowrap sm:pl-6">{cat.name}</td>
                                            <td className="px-3 py-4 text-sm text-gray-500 whitespace-nowrap">{cat.subcategories?.length || 0}</td>
                                            <td className="px-3 py-4 text-sm text-gray-500 whitespace-nowrap">{cat.attachmentRequired ? 'Yes' : 'No'}</td>
                                            <td className="px-3 py-4 text-sm text-gray-500 whitespace-nowrap">{cat.autoApproveAmount.toLocaleString('en-IN')}</td>
                                            <td className="relative py-4 pl-3 pr-4 text-sm font-medium text-right whitespace-nowrap sm:pr-6">
                                                <button onClick={() => handleOpenCategoryModal(cat)} className="text-primary hover:text-primary-hover"><PencilIcon className="w-4 h-4" /></button>
                                                <button onClick={() => handleDeleteCategory(cat)} className="ml-4 text-red-600 hover:text-red-800"><TrashIcon className="w-4 h-4" /></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
          </div>
        )}

        {activeAdminTab === 'subcategories' && (
           <div>
            <div className="sm:flex sm:items-center">
              <div className="sm:flex-auto">
                <h3 className="text-base font-semibold leading-6 text-gray-900">Subcategories</h3>
                <p className="mt-2 text-sm text-gray-700">Manage subcategories for each main expense category.</p>
              </div>
              <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
                <button onClick={() => handleOpenSubcategoryModal()} type="button" className="inline-flex items-center px-3 py-2 text-sm font-semibold text-white rounded-md shadow-sm bg-primary hover:bg-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
                    <PlusIcon className="w-5 h-5 mr-2" /> Add subcategory
                </button>
              </div>
            </div>
            <div className="flow-root mt-8">
                <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                    <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                            <table className="min-w-full bg-white divide-y divide-gray-300">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Subcategory Name</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Parent Category</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Attachment Required</th>
                                        <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6"><span className="sr-only">Edit</span></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {categories.map((cat) => (
                                      cat.subcategories?.map(subcat => (
                                        <tr key={subcat.id}>
                                            <td className="py-4 pl-4 pr-3 text-sm font-medium text-gray-900 whitespace-nowrap sm:pl-6">{subcat.name}</td>
                                            <td className="px-3 py-4 text-sm text-gray-500 whitespace-nowrap">{cat.name}</td>
                                            <td className="px-3 py-4 text-sm text-gray-500 whitespace-nowrap">{subcat.attachmentRequired ? 'Yes' : 'No'}</td>
                                            <td className="relative py-4 pl-3 pr-4 text-sm font-medium text-right whitespace-nowrap sm:pr-6">
                                                <button onClick={() => handleOpenSubcategoryModal(subcat, cat.id)} className="text-primary hover:text-primary-hover"><PencilIcon className="w-4 h-4" /></button>
                                                <button onClick={() => onDeleteSubcategory(cat.id, subcat.id)} className="ml-4 text-red-600 hover:text-red-800"><TrashIcon className="w-4 h-4" /></button>
                                            </td>
                                        </tr>
                                      ))
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
          </div>
        )}
        
        {activeAdminTab === 'projects' && (
          <div>
            <div className="sm:flex sm:items-center">
              <div className="sm:flex-auto">
                <h3 className="text-base font-semibold leading-6 text-gray-900">Projects</h3>
                <p className="mt-2 text-sm text-gray-700">Manage the list of available projects for expense submission.</p>
              </div>
              <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
                <button onClick={() => handleOpenProjectModal()} type="button" className="inline-flex items-center px-3 py-2 text-sm font-semibold text-white rounded-md shadow-sm bg-primary hover:bg-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
                    <PlusIcon className="w-5 h-5 mr-2" /> Add project
                </button>
              </div>
            </div>
            <div className="flow-root mt-8">
                <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                    <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                            <table className="min-w-full bg-white divide-y divide-gray-300">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Project Name</th>
                                        <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6"><span className="sr-only">Edit</span></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {projects.map((project) => (
                                        <tr key={project.id}>
                                            <td className="py-4 pl-4 pr-3 text-sm font-medium text-gray-900 whitespace-nowrap sm:pl-6">{project.name}</td>
                                            <td className="relative py-4 pl-3 pr-4 text-sm font-medium text-right whitespace-nowrap sm:pr-6">
                                                <button onClick={() => handleOpenProjectModal(project)} className="text-primary hover:text-primary-hover"><PencilIcon className="w-4 h-4" /></button>
                                                <button onClick={() => handleDeleteProject(project)} className="ml-4 text-red-600 hover:text-red-800"><TrashIcon className="w-4 h-4" /></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
          </div>
        )}

        {activeAdminTab === 'sites' && (
          <div>
            <div className="sm:flex sm:items-center">
              <div className="sm:flex-auto">
                <h3 className="text-base font-semibold leading-6 text-gray-900">Sites/Places</h3>
                <p className="mt-2 text-sm text-gray-700">Manage the list of available sites or places for expense submission.</p>
              </div>
              <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
                <button onClick={() => handleOpenSiteModal()} type="button" className="inline-flex items-center px-3 py-2 text-sm font-semibold text-white rounded-md shadow-sm bg-primary hover:bg-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
                    <PlusIcon className="w-5 h-5 mr-2" /> Add Site/Place
                </button>
              </div>
            </div>
            <div className="flow-root mt-8">
                <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                    <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                            <table className="min-w-full bg-white divide-y divide-gray-300">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Site/Place Name</th>
                                        <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6"><span className="sr-only">Edit</span></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {sites.map((site) => (
                                        <tr key={site.id}>
                                            <td className="py-4 pl-4 pr-3 text-sm font-medium text-gray-900 whitespace-nowrap sm:pl-6">{site.name}</td>
                                            <td className="relative py-4 pl-3 pr-4 text-sm font-medium text-right whitespace-nowrap sm:pr-6">
                                                <button onClick={() => handleOpenSiteModal(site)} className="text-primary hover:text-primary-hover"><PencilIcon className="w-4 h-4" /></button>
                                                <button onClick={() => handleDeleteSite(site)} className="ml-4 text-red-600 hover:text-red-800"><TrashIcon className="w-4 h-4" /></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
          </div>
        )}

        {activeAdminTab === 'audit' && (
          <div>
            <div className="sm:flex sm:items-center">
              <div className="sm:flex-auto">
                <h3 className="text-base font-semibold leading-6 text-gray-900">Audit Log</h3>
                <p className="mt-2 text-sm text-gray-700">A history of all administrative actions performed in the system.</p>
              </div>
            </div>
            <div className="flow-root mt-8">
                <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                    <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                            <table className="min-w-full bg-white divide-y divide-gray-300">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Timestamp</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Performed By</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Action</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Details</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {auditLog.map((log) => (
                                        <tr key={log.id}>
                                            <td className="py-4 pl-4 pr-3 text-sm text-gray-500 whitespace-nowrap sm:pl-6">{formatDateTime(log.timestamp)}</td>
                                            <td className="px-3 py-4 text-sm text-gray-500 whitespace-nowrap">{log.actorName}</td>
                                            <td className="px-3 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">{log.action}</td>
                                            <td className="px-3 py-4 text-sm text-gray-500 whitespace-nowrap">{log.details}</td>
                                        </tr>
                                    ))}
                                    {auditLog.length === 0 && (
                                      <tr>
                                        <td colSpan={4} className="py-8 text-center text-sm text-gray-500">No audit log entries found.</td>
                                      </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
          </div>
        )}
        
        {activeAdminTab === 'system' && (
          <div className="p-6 bg-white rounded-lg shadow">
            <h3 className="text-base font-semibold leading-6 text-gray-900">System Actions</h3>
            <div className="mt-4">
              <div className="p-4 border rounded-md">
                <h4 className="font-medium">Data Backup</h4>
                <p className="mt-1 text-sm text-gray-600">Generate a full backup of the system data (Users, Expenses, Categories, etc.) and send it to all administrator email addresses. This action will be recorded in the audit log.</p>
                <div className="mt-3">
                  <button 
                    onClick={onTriggerBackup} 
                    type="button" 
                    className="px-3 py-2 text-sm font-semibold text-white rounded-md shadow-sm bg-primary hover:bg-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
                      Trigger Backup Email
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeAdminTab === 'recycle_bin' && (
           <div>
            <div className="sm:flex sm:items-center">
              <div className="sm:flex-auto">
                <h3 className="text-base font-semibold leading-6 text-gray-900">Recycle Bin</h3>
                <p className="mt-2 text-sm text-gray-700">Deleted expenses are stored here and can be restored or permanently deleted.</p>
                <p className="mt-1 text-xs italic text-gray-500">Note: Items in the Recycle Bin will be permanently deleted after 5 days.</p>
              </div>
            </div>
            <div className="flow-root mt-8">
                <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                    <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                            <table className="min-w-full bg-white divide-y divide-gray-300">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Reference #</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Requestor</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Amount (₹)</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Deleted On</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Deleted By</th>
                                        <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6"><span className="sr-only">Actions</span></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {deletedExpenses.map((expense) => (
                                        <tr key={expense.id}>
                                            <td className="py-4 pl-4 pr-3 text-sm font-mono text-gray-900 whitespace-nowrap sm:pl-6">{expense.referenceNumber}</td>
                                            <td className="px-3 py-4 text-sm text-gray-500 whitespace-nowrap">{expense.requestorName}</td>
                                            <td className="px-3 py-4 text-sm text-gray-500 whitespace-nowrap">{expense.amount.toLocaleString('en-IN')}</td>
                                            <td className="px-3 py-4 text-sm text-gray-500 whitespace-nowrap">{formatDateTime(expense.deletedAt!)}</td>
                                            <td className="px-3 py-4 text-sm text-gray-500 whitespace-nowrap">{getUserNameById(expense.deletedBy)}</td>
                                            <td className="relative flex items-center justify-end py-4 pl-3 pr-4 space-x-4 text-sm font-medium text-right whitespace-nowrap sm:pr-6">
                                                <button onClick={() => onRestoreExpense(expense.id)} className="text-secondary hover:text-green-700" title="Restore Expense">
                                                    <ArrowUturnLeftIcon className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => onPermanentlyDeleteExpense(expense.id)} className="text-red-600 hover:text-red-800" title="Delete Permanently">
                                                  <TrashIcon className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {deletedExpenses.length === 0 && (
                                       <tr>
                                        <td colSpan={6} className="py-8 text-center text-sm text-gray-500">The Recycle Bin is empty.</td>
                                      </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
          </div>
        )}

      </div>

      <Modal isOpen={isUserModalOpen} onClose={() => setUserModalOpen(false)} title={'Edit User'}>
          <form onSubmit={handleUserFormSubmit} className="space-y-4">
              <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">Full Name</label>
                  <input type="text" name="name" id="name" defaultValue={editingUser?.name || ''} required className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm" />
              </div>
              <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700">Username</label>
                  <input type="text" name="username" id="username" defaultValue={editingUser?.username || ''} required className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm" />
              </div>
               <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email (Read-only)</label>
                  <input type="email" name="email" id="email" defaultValue={editingUser?.email || ''} required disabled className="block w-full mt-1 bg-gray-100 border-gray-300 rounded-md shadow-sm cursor-not-allowed focus:ring-primary focus:border-primary sm:text-sm" />
              </div>
               <div>
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700">Role</label>
                  <select id="role" name="role" defaultValue={editingUser?.role || Role.REQUESTOR} className="block w-full py-2 pl-3 pr-10 mt-1 text-base border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary sm:text-sm">
                      {Object.values(Role).map(role => <option key={role} value={role}>{role}</option>)}
                  </select>
              </div>
              <div className="pt-4 text-right">
                  <button type="button" onClick={() => setUserModalOpen(false)} className="px-4 py-2 mr-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50">Cancel</button>
                  <button type="submit" className="px-4 py-2 text-sm font-medium text-white border border-transparent rounded-md shadow-sm bg-primary hover:bg-primary-hover">Save</button>
              </div>
          </form>
      </Modal>

      <Modal isOpen={isCategoryModalOpen} onClose={() => setCategoryModalOpen(false)} title={editingCategory ? 'Edit Category' : 'Add Category'}>
          <form onSubmit={handleCategoryFormSubmit} className="space-y-4">
              <div>
                  <label htmlFor="cat-name" className="block text-sm font-medium text-gray-700">Category Name</label>
                  <input type="text" name="name" id="cat-name" defaultValue={editingCategory?.name || ''} required className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm" />
              </div>
              <div>
                  <label htmlFor="autoApproveAmount" className="block text-sm font-medium text-gray-700">Auto-Approve Limit (₹)</label>
                  <input type="number" name="autoApproveAmount" id="autoApproveAmount" defaultValue={editingCategory?.autoApproveAmount || 0} required className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm" />
              </div>
               <div className="relative flex items-start">
                  <div className="flex items-center h-5">
                      <input id="attachmentRequired" name="attachmentRequired" type="checkbox" defaultChecked={editingCategory?.attachmentRequired || false} className="w-4 h-4 border-gray-300 rounded text-primary focus:ring-primary" />
                  </div>
                  <div className="ml-3 text-sm">
                      <label htmlFor="attachmentRequired" className="font-medium text-gray-700">Attachment is mandatory</label>
                  </div>
              </div>
              <div className="pt-4 text-right">
                  <button type="button" onClick={() => setCategoryModalOpen(false)} className="px-4 py-2 mr-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50">Cancel</button>
                  <button type="submit" className="px-4 py-2 text-sm font-medium text-white border border-transparent rounded-md shadow-sm bg-primary hover:bg-primary-hover">Save</button>
              </div>
          </form>
      </Modal>

      <Modal isOpen={isSubcategoryModalOpen} onClose={() => setSubcategoryModalOpen(false)} title={editingSubcategory ? 'Edit Subcategory' : 'Add Subcategory'}>
          <form onSubmit={handleSubcategoryFormSubmit} className="space-y-4">
              <div>
                  <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700">Parent Category</label>
                  <select id="categoryId" name="categoryId" defaultValue={editingSubcategory?.categoryId || ''} required disabled={!!editingSubcategory} className="block w-full py-2 pl-3 pr-10 mt-1 text-base border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary sm:text-sm disabled:bg-gray-100">
                      <option value="" disabled>Select a category</option>
                      {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                  </select>
              </div>
              <div>
                  <label htmlFor="sub-cat-name" className="block text-sm font-medium text-gray-700">Subcategory Name</label>
                  <input type="text" name="name" id="sub-cat-name" defaultValue={editingSubcategory?.subcategory.name || ''} required className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm" />
              </div>
               <div className="relative flex items-start">
                  <div className="flex items-center h-5">
                      <input id="sub-attachmentRequired" name="attachmentRequired" type="checkbox" defaultChecked={editingSubcategory?.subcategory.attachmentRequired || false} className="w-4 h-4 border-gray-300 rounded text-primary focus:ring-primary" />
                  </div>
                  <div className="ml-3 text-sm">
                      <label htmlFor="sub-attachmentRequired" className="font-medium text-gray-700">Attachment is mandatory</label>
                  </div>
              </div>
              <div className="pt-4 text-right">
                  <button type="button" onClick={() => setSubcategoryModalOpen(false)} className="px-4 py-2 mr-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50">Cancel</button>
                  <button type="submit" className="px-4 py-2 text-sm font-medium text-white border border-transparent rounded-md shadow-sm bg-primary hover:bg-primary-hover">Save</button>
              </div>
          </form>
      </Modal>

      <Modal isOpen={isProjectModalOpen} onClose={() => setProjectModalOpen(false)} title={editingProject ? 'Edit Project' : 'Add Project'}>
          <form onSubmit={handleProjectFormSubmit} className="space-y-4">
              <div>
                  <label htmlFor="project-name" className="block text-sm font-medium text-gray-700">Project Name</label>
                  <input type="text" name="name" id="project-name" defaultValue={editingProject?.name || ''} required className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm" />
              </div>
              <div className="pt-4 text-right">
                  <button type="button" onClick={() => setProjectModalOpen(false)} className="px-4 py-2 mr-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50">Cancel</button>
                  <button type="submit" className="px-4 py-2 text-sm font-medium text-white border border-transparent rounded-md shadow-sm bg-primary hover:bg-primary-hover">Save</button>
              </div>
          </form>
      </Modal>

      <Modal isOpen={isSiteModalOpen} onClose={() => setSiteModalOpen(false)} title={editingSite ? 'Edit Site/Place' : 'Add Site/Place'}>
          <form onSubmit={handleSiteFormSubmit} className="space-y-4">
              <div>
                  <label htmlFor="site-name" className="block text-sm font-medium text-gray-700">Site/Place Name</label>
                  <input type="text" name="name" id="site-name" defaultValue={editingSite?.name || ''} required className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm" />
              </div>
              <div className="pt-4 text-right">
                  <button type="button" onClick={() => setSiteModalOpen(false)} className="px-4 py-2 mr-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50">Cancel</button>
                  <button type="submit" className="px-4 py-2 text-sm font-medium text-white border border-transparent rounded-md shadow-sm bg-primary hover:bg-primary-hover">Save</button>
              </div>
          </form>
      </Modal>

    </div>
  );
};

export default AdminPanel;