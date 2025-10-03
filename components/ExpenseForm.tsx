import React, { useState, useRef } from 'react';
import { Category, Expense, Project, Site } from '../types';
import { PaperClipIcon, XCircleIcon } from './Icons';

interface ExpenseFormProps {
  categories: Category[];
  projects: Project[];
  sites: Site[];
  onSubmit: (expenseData: Omit<Expense, 'id' | 'status' | 'submittedAt' | 'history' | 'requestorId' | 'requestorName' | 'referenceNumber' | 'attachment_path' | 'subcategory_attachment_path'> & { attachment?: File, subcategoryAttachment?: File }) => void;
  onClose: () => void;
}

const ExpenseForm: React.FC<ExpenseFormProps> = ({ categories, projects, sites, onSubmit, onClose }) => {
  const [categoryId, setCategoryId] = useState<string>(categories[0]?.id || '');
  const [subcategoryId, setSubcategoryId] = useState<string>('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState<string>(projects[0]?.id || '');
  const [siteId, setSiteId] = useState<string>(sites[0]?.id || '');
  const [attachment, setAttachment] = useState<File | undefined>(undefined);
  const [subcategoryAttachment, setSubcategoryAttachment] = useState<File | undefined>(undefined);
  const [showSubcategoryAttachmentInput, setShowSubcategoryAttachmentInput] = useState(false);
  const [error, setError] = useState('');

  const categoryAttachmentInputRef = useRef<HTMLInputElement>(null);
  const subcategoryAttachmentInputRef = useRef<HTMLInputElement>(null);

  const selectedCategory = categories.find(c => c.id === categoryId);
  const subcategoriesForSelectedCategory = selectedCategory?.subcategories || [];
  const selectedSubcategory = subcategoriesForSelectedCategory.find(sc => sc.id === subcategoryId);

  const handleRemoveSubcategoryAttachment = () => {
    setSubcategoryAttachment(undefined);
    if (subcategoryAttachmentInputRef.current) {
        subcategoryAttachmentInputRef.current.value = '';
    }
  };
  
  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCategoryId(e.target.value);
    setSubcategoryId(''); // Reset subcategory when category changes
    setShowSubcategoryAttachmentInput(false); // Reset toggle
    handleRemoveSubcategoryAttachment(); // Clear file
  };

  const handleSubcategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSubcategoryId(e.target.value);
    setShowSubcategoryAttachmentInput(false); // Reset toggle
    handleRemoveSubcategoryAttachment(); // Clear file
  };

  const handleToggleSubcategoryAttachment = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = e.target.checked;
    setShowSubcategoryAttachmentInput(isChecked);
    if (!isChecked) {
        handleRemoveSubcategoryAttachment(); // clear file if unchecked
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAttachment(e.target.files[0]);
    }
  };

  const handleRemoveCategoryAttachment = () => {
    setAttachment(undefined);
    if (categoryAttachmentInputRef.current) {
        categoryAttachmentInputRef.current.value = '';
    }
  };
  
  const handleSubcategoryFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSubcategoryAttachment(e.target.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (selectedCategory?.attachmentRequired && !attachment) {
      setError(`An attachment is required for the '${selectedCategory.name}' category.`);
      return;
    }
    
    if (!categoryId || !amount || !description || !projectId || !siteId) {
        setError("All fields are required.");
        return;
    }

    onSubmit({
      categoryId,
      subcategoryId: subcategoryId || undefined,
      amount: parseFloat(amount),
      description,
      projectId,
      siteId,
      attachment,
      subcategoryAttachment,
    });
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="category" className="block text-sm font-medium text-gray-700">Category</label>
        <select
          id="category"
          value={categoryId}
          onChange={handleCategoryChange}
          required
          className="block w-full py-2 pl-3 pr-10 mt-1 text-base border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
        >
          {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
        </select>
      </div>

      {subcategoriesForSelectedCategory.length > 0 && (
        <div>
            <label htmlFor="subcategory" className="block text-sm font-medium text-gray-700">Subcategory (Optional)</label>
            <select
              id="subcategory"
              value={subcategoryId}
              onChange={handleSubcategoryChange}
              className="block w-full py-2 pl-3 pr-10 mt-1 text-base border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
            >
                <option value="">-- No Subcategory --</option>
                {subcategoriesForSelectedCategory.map(subcat => <option key={subcat.id} value={subcat.id}>{subcat.name}</option>)}
            </select>
        </div>
      )}

      <div>
        <label htmlFor="projectId" className="block text-sm font-medium text-gray-700">Project Name</label>
        <select
          id="projectId"
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          required
          className="block w-full py-2 pl-3 pr-10 mt-1 text-base border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
        >
          {projects.map(proj => <option key={proj.id} value={proj.id}>{proj.name}</option>)}
        </select>
      </div>

       <div>
        <label htmlFor="siteId" className="block text-sm font-medium text-gray-700">Site/Place</label>
        <select
          id="siteId"
          value={siteId}
          onChange={(e) => setSiteId(e.target.value)}
          required
          className="block w-full py-2 pl-3 pr-10 mt-1 text-base border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
        >
          {sites.map(site => <option key={site.id} value={site.id}>{site.name}</option>)}
        </select>
      </div>

      <div>
        <label htmlFor="amount" className="block text-sm font-medium text-gray-700">Amount (₹)</label>
        <div className="relative mt-1 rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <span className="text-gray-500 sm:text-sm">₹</span>
            </div>
            <input
                type="number"
                id="amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="block w-full py-2 pl-7 pr-12 border-gray-300 rounded-md focus:ring-primary focus:border-primary sm:text-sm"
                placeholder="0.00"
            />
        </div>
      </div>
      
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          id="description"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
        ></textarea>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Category Attachment {selectedCategory?.attachmentRequired && <span className="text-red-500">*</span>}</label>
        <div className="flex items-center justify-center w-full px-6 pt-5 pb-6 mt-1 border-2 border-gray-300 border-dashed rounded-md">
            <div className="space-y-1 text-center">
                { !attachment && <PaperClipIcon className="w-12 h-12 mx-auto text-gray-400"/> }
                <div className="flex justify-center text-sm text-gray-600">
                    <label htmlFor="file-upload" className="relative font-medium rounded-md cursor-pointer text-primary hover:text-primary-hover focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary">
                        <span>Upload a file</span>
                        <input ref={categoryAttachmentInputRef} id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} />
                    </label>
                    {!attachment && <p className="pl-1">or drag and drop</p>}
                </div>
                 {attachment ? (
                    <div className="flex items-center justify-center pt-1 text-xs text-gray-600">
                        <PaperClipIcon className="w-4 h-4 mr-1"/>
                        <span className="font-medium truncate">{attachment.name}</span>
                        <button type="button" onClick={handleRemoveCategoryAttachment} className="ml-2 text-red-500 hover:text-red-700">
                            <XCircleIcon className="w-4 h-4" />
                        </button>
                    </div>
                 ) : <p className="text-xs text-gray-500">PNG, JPG, PDF up to 10MB</p>}
            </div>
        </div>
      </div>
      
      {subcategoryId && (
        <div className="p-3 space-y-4 border border-gray-200 rounded-md bg-neutral-50">
            <div className="relative flex items-start">
                <div className="flex items-center h-5">
                    <input 
                        id="add-sub-attachment-toggle" 
                        name="add-sub-attachment-toggle" 
                        type="checkbox" 
                        checked={showSubcategoryAttachmentInput} 
                        onChange={handleToggleSubcategoryAttachment}
                        className="w-4 h-4 border-gray-300 rounded text-primary focus:ring-primary"
                    />
                </div>
                <div className="ml-3 text-sm">
                    <label htmlFor="add-sub-attachment-toggle" className="font-medium text-gray-700">
                        Add Subcategory Attachment {selectedSubcategory?.attachmentRequired && <span className="text-red-500">*</span>}
                    </label>
                    <p className="text-xs text-gray-500">
                        This attachment is optional for submission.
                        {selectedSubcategory?.attachmentRequired && " (Recommended as per policy)"}
                    </p>
                </div>
            </div>
            
            {showSubcategoryAttachmentInput && (
                <div className="flex items-center justify-center w-full px-6 pt-5 pb-6 bg-white border-2 border-gray-300 border-dashed rounded-md">
                    <div className="space-y-1 text-center">
                        { !subcategoryAttachment && <PaperClipIcon className="w-12 h-12 mx-auto text-gray-400"/> }
                        <div className="flex justify-center text-sm text-gray-600">
                            <label htmlFor="sub-file-upload" className="relative font-medium rounded-md cursor-pointer text-primary hover:text-primary-hover focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary">
                                <span>Upload a file</span>
                                <input ref={subcategoryAttachmentInputRef} id="sub-file-upload" name="sub-file-upload" type="file" className="sr-only" onChange={handleSubcategoryFileChange} />
                            </label>
                            {!subcategoryAttachment && <p className="pl-1">or drag and drop</p>}
                        </div>
                        {subcategoryAttachment ? (
                            <div className="flex items-center justify-center pt-1 text-xs text-gray-600">
                                <PaperClipIcon className="w-4 h-4 mr-1"/>
                                <span className="font-medium truncate">{subcategoryAttachment.name}</span>
                                <button type="button" onClick={handleRemoveSubcategoryAttachment} className="ml-2 text-red-500 hover:text-red-700">
                                    <XCircleIcon className="w-4 h-4" />
                                </button>
                            </div>
                        ) : <p className="text-xs text-gray-500">PNG, JPG, PDF up to 10MB</p>}
                    </div>
                </div>
            )}
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
      
      <div className="pt-4 text-right">
        <button type="button" onClick={onClose} className="px-4 py-2 mr-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50">Cancel</button>
        <button type="submit" className="px-4 py-2 text-sm font-medium text-white border border-transparent rounded-md shadow-sm bg-primary hover:bg-primary-hover">Submit Request</button>
      </div>
    </form>
  );
};

export default ExpenseForm;