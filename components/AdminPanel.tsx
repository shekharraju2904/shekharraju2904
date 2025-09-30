import React, { useState, useRef } from 'react';
import { User, Category, Role, Subcategory, AuditLogItem, Project, Site, Expense, AvailableBackups } from '../types';
import { PencilIcon, TrashIcon, PlusIcon, DocumentArrowDownIcon, UploadIcon } from './Icons';
import Modal from './Modal';

interface AdminPanelProps {
  users: User[];
  categories: Category[];
  projects: Project[];
  sites: Site[];
  expenses: Expense[];
  auditLog: AuditLogItem[];
  isDailyBackupEnabled: boolean;
  availableBackups: AvailableBackups;
  onAddUser: (user: Omit<User, 'id'>) => void;
  onUpdateUser: (user: User) => void;
  onDeleteUser: (userId: string) => void;
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
  onToggleDailyBackup: () => void;
  onManualBackup: () => void;
  onImportBackup: (file: File) => void;
  onCreateMirrorBackup: () => void;
  onDownloadSpecificBackup: (key: string) => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({
  users, categories, projects, sites, auditLog, isDailyBackupEnabled, availableBackups,
  onAddUser, onUpdateUser, onDeleteUser,
  onAddCategory, onUpdateCategory, onDeleteCategory,
  onAddSubcategory, onUpdateSubcategory, onDeleteSubcategory,
  onAddProject, onUpdateProject, onDeleteProject,
  onAddSite, onUpdateSite, onDeleteSite,
  onToggleDailyBackup, onManualBackup, onImportBackup, onCreateMirrorBackup, onDownloadSpecificBackup
}) => {
  const [activeTab, setActiveTab] = useState('users');
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

  const importBackupInputRef = useRef<HTMLInputElement>(null);

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
    const password = formData.get('password') as string;
    const email = formData.get('email') as string;

    if (editingUser) {
        const updatedData: Partial<User> = { name, username, role, email };
        if (password) {
            updatedData.password = password;
        }
        onUpdateUser({ ...editingUser, ...updatedData });
    } else {
        onAddUser({ name, username, role, password, email });
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

  const handleImportClick = () => {
    importBackupInputRef.current?.click();
  };

  const handleFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
        onImportBackup(file);
    }
    // Reset file input to allow selecting the same file again
    event.target.value = '';
  };


  const TabButton = ({ tabId, label }: { tabId: string, label: string }) => (
     <button
        onClick={() => setActiveTab(tabId)}
        className={`${activeTab === tabId ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
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
          <TabButton tabId="backup" label="Backup & Export" />
        </nav>
      </div>

      <div className="mt-8">
        {activeTab === 'users' && (
          <div>
            <div className="sm:flex sm:items-center">
              <div className="sm:flex-auto">
                <h3 className="text-base font-semibold leading-6 text-gray-900">Users</h3>
                <p className="mt-2 text-sm text-gray-700">A list of all the users in the system.</p>
              </div>
              <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
                <button onClick={() => handleOpenUserModal()} type="button" className="inline-flex items-center px-3 py-2 text-sm font-semibold text-white rounded-md shadow-sm bg-primary hover:bg-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
                    <PlusIcon className="w-5 h-5 mr-2" /> Add user
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
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Username</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Email</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Role</th>
                                        <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6"><span className="sr-only">Edit</span></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {users.map((user) => (
                                        <tr key={user.id}>
                                            <td className="py-4 pl-4 pr-3 text-sm font-medium text-gray-900 whitespace-nowrap sm:pl-6">{user.name}</td>
                                            <td className="px-3 py-4 text-sm text-gray-500 whitespace-nowrap">{user.username}</td>
                                            <td className="px-3 py-4 text-sm text-gray-500 whitespace-nowrap">{user.email}</td>
                                            <td className="px-3 py-4 text-sm text-gray-500 whitespace-nowrap">{user.role}</td>
                                            <td className="relative py-4 pl-3 pr-4 text-sm font-medium text-right whitespace-nowrap sm:pr-6">
                                                <button onClick={() => handleOpenUserModal(user)} className="text-primary hover:text-primary-hover"><PencilIcon className="w-4 h-4" /></button>
                                                <button onClick={() => onDeleteUser(user.id)} className="ml-4 text-red-600 hover:text-red-800"><TrashIcon className="w-4 h-4" /></button>
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
        
        {activeTab === 'categories' && (
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
                                                <button onClick={() => onDeleteCategory(cat.id)} className="ml-4 text-red-600 hover:text-red-800"><TrashIcon className="w-4 h-4" /></button>
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

        {activeTab === 'subcategories' && (
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
        
        {activeTab === 'projects' && (
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
                                                <button onClick={() => onDeleteProject(project.id)} className="ml-4 text-red-600 hover:text-red-800"><TrashIcon className="w-4 h-4" /></button>
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

        {activeTab === 'sites' && (
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
                                                <button onClick={() => onDeleteSite(site.id)} className="ml-4 text-red-600 hover:text-red-800"><TrashIcon className="w-4 h-4" /></button>
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

        {activeTab === 'audit' && (
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

        {activeTab === 'backup' && (
          <div>
            <div className="sm:flex-auto">
                <h3 className="text-base font-semibold leading-6 text-gray-900">Backup & Export</h3>
                <p className="mt-2 text-sm text-gray-700">Manage data import, export, and retention policies.</p>
            </div>
            <div className="grid grid-cols-1 gap-8 mt-8 lg:grid-cols-2">
                
                {/* Left Column */}
                <div className="space-y-6">
                    {/* Import Section */}
                    <div className="p-6 bg-white rounded-lg shadow">
                        <h4 className="font-semibold text-gray-800">Import & Restore</h4>
                        <p className="mt-1 text-sm text-gray-600">Restore the application state from a JSON backup file. <span className="font-bold text-red-600">Warning: This will overwrite all current data.</span></p>
                        <input type="file" ref={importBackupInputRef} className="hidden" accept="application/json" onChange={handleFileSelected} />
                        <div className="mt-4">
                            <button type="button" onClick={handleImportClick} className="inline-flex items-center px-3 py-2 text-sm font-semibold text-white bg-yellow-600 rounded-md shadow-sm hover:bg-yellow-700">
                                <UploadIcon className="w-5 h-5 mr-2" />
                                Import from Backup
                            </button>
                        </div>
                    </div>

                     {/* Ad-hoc Backup Section */}
                    <div className="p-6 bg-white rounded-lg shadow">
                        <h4 className="font-semibold text-gray-800">Ad-Hoc Manual Backup</h4>
                        <p className="mt-1 text-sm text-gray-600">Generate and download a full JSON backup of all system data immediately. This backup is not stored automatically.</p>
                        <div className="mt-4">
                            <button type="button" onClick={onManualBackup} className="inline-flex items-center px-3 py-2 text-sm font-semibold text-white rounded-md shadow-sm bg-primary hover:bg-primary-hover">
                                <DocumentArrowDownIcon className="w-5 h-5 mr-2" />
                                Download Backup Now
                            </button>
                        </div>
                    </div>

                    {/* Mirror Backup Section */}
                    <div className="p-6 bg-white rounded-lg shadow">
                        <h4 className="font-semibold text-gray-800">Mirror Backup (6-Month Retention)</h4>
                        <p className="mt-1 text-sm text-gray-600">Create a long-term mirror backup. Backups older than 6 months will be automatically deleted.</p>
                         <div className="mt-4">
                            <button type="button" onClick={onCreateMirrorBackup} className="inline-flex items-center px-3 py-2 text-sm font-semibold text-white bg-green-600 rounded-md shadow-sm hover:bg-green-700">
                                Create 6-Month Mirror Backup
                            </button>
                        </div>
                        <div className="mt-4">
                            <h5 className="text-sm font-medium text-gray-700">Available Mirror Backups:</h5>
                            <ul className="mt-2 space-y-2 text-sm text-gray-600 max-h-40 overflow-y-auto">
                                {availableBackups.mirror.length > 0 ? availableBackups.mirror.map(key => (
                                    <li key={key} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                                        <span className="font-mono">{key.replace('mirror_backup_', '')}</span>
                                        <button onClick={() => onDownloadSpecificBackup(key)} className="text-primary hover:text-primary-hover"><DocumentArrowDownIcon className="w-5 h-5" /></button>
                                    </li>
                                )) : <li className="text-gray-500">No mirror backups found.</li>}
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                    {/* Automatic Backup Section */}
                    <div className="p-6 bg-white rounded-lg shadow">
                        <h4 className="font-semibold text-gray-800">Automatic Daily Backups (20-Day Retention)</h4>
                        <p className="mt-1 text-sm text-gray-600">If enabled, a backup is created daily at 12:05 AM, an email is sent to admins, and the last 20 backups are retained.</p>
                        <div className="flex items-center mt-4">
                            <button type="button" className={`${isDailyBackupEnabled ? 'bg-primary' : 'bg-gray-200'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2`} role="switch" aria-checked={isDailyBackupEnabled} onClick={onToggleDailyBackup}>
                                <span className="sr-only">Toggle daily backups</span>
                                <span aria-hidden="true" className={`${isDailyBackupEnabled ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`} />
                            </button>
                            <span className="ml-3 text-sm font-medium text-gray-900">{isDailyBackupEnabled ? 'Enabled' : 'Disabled'}</span>
                        </div>
                        <div className="mt-4">
                            <h5 className="text-sm font-medium text-gray-700">Recent Daily Backups:</h5>
                            <ul className="mt-2 space-y-2 text-sm text-gray-600 max-h-96 overflow-y-auto">
                                {availableBackups.daily.length > 0 ? availableBackups.daily.map(key => (
                                    <li key={key} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                                        <span className="font-mono">{key.replace('backup_', '')}</span>
                                        <button onClick={() => onDownloadSpecificBackup(key)} className="text-primary hover:text-primary-hover"><DocumentArrowDownIcon className="w-5 h-5" /></button>
                                    </li>
                                )) : <li className="text-gray-500">No recent daily backups found.</li>}
                            </ul>
                        </div>
                    </div>
                </div>

            </div>
          </div>
        )}
      </div>

      <Modal isOpen={isUserModalOpen} onClose={() => setUserModalOpen(false)} title={editingUser ? 'Edit User' : 'Add User'}>
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
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                  <input type="email" name="email" id="email" defaultValue={editingUser?.email || ''} required className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm" />
              </div>
               <div>
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700">Role</label>
                  <select id="role" name="role" defaultValue={editingUser?.role || Role.REQUESTOR} className="block w-full py-2 pl-3 pr-10 mt-1 text-base border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary sm:text-sm">
                      {Object.values(Role).map(role => <option key={role} value={role}>{role}</option>)}
                  </select>
              </div>
              <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                  <input 
                      type="password" 
                      name="password" 
                      id="password"
                      autoComplete="new-password"
                      placeholder={editingUser ? 'Leave blank to keep unchanged' : ''}
                      required={!editingUser}
                      className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm" />
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
