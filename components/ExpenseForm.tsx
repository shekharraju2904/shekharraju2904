import React, { useState, useRef, DragEvent } from 'react';
import { Category, Expense, Project, Site } from '../types';
import { PaperClipIcon, XCircleIcon, UploadCloud, FileImage } from './Icons';

interface ExpenseFormProps {
  categories: Category[];
  projects: Project[];
  sites: Site[];
  onSubmit: (expenseData: Omit<Expense, 'id' | 'status' | 'submittedAt' | 'history' | 'requestorId' | 'requestorName' | 'referenceNumber' | 'attachment_path' | 'subcategory_attachment_path'> & { attachment?: File, subcategoryAttachment?: File }) => void;
  onClose: () => void;
}

const FileInput: React.FC<{
    label: string;
    file: File | undefined;
    setFile: (file: File | undefined) => void;
    inputRef: React.RefObject<HTMLInputElement>;
    isRequired?: boolean;
}> = ({ label, file, setFile, inputRef, isRequired }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const handleFileChange = (selectedFile: File | undefined) => {
        if (selectedFile) {
            setFile(selectedFile);
            if (selectedFile.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setPreviewUrl(reader.result as string);
                };
                reader.readAsDataURL(selectedFile);
            } else {
                setPreviewUrl(null);
            }
        }
    };

    const handleRemoveFile = () => {
        setFile(undefined);
        setPreviewUrl(null);
        if (inputRef.current) {
            inputRef.current.value = '';
        }
    };

    const onDragEnter = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };
    const onDragLeave = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };
    const onDragOver = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    };
    const onDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFileChange(e.dataTransfer.files[0]);
        }
    };

    return (
        <div>
            <label className="block text-sm font-medium text-neutral-300">{label} {isRequired && <span className="text-accent-danger">*</span>}</label>
            {file ? (
                <div className="relative flex items-center p-3 mt-1 bg-neutral-900/50 border border-neutral-700 rounded-lg">
                    {previewUrl ? (
                         <img src={previewUrl} alt="Preview" className="w-12 h-12 mr-3 object-cover rounded-md" />
                    ) : (
                        <div className="flex items-center justify-center w-12 h-12 mr-3 bg-neutral-700 rounded-md">
                            <FileImage className="w-6 h-6 text-neutral-400" />
                        </div>
                    )}
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-neutral-100 truncate">{file.name}</p>
                        <p className="text-xs text-neutral-400">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                    <button type="button" onClick={handleRemoveFile} className="ml-2 p-1 text-neutral-400 rounded-full hover:bg-neutral-700 hover:text-white">
                        <XCircleIcon className="w-5 h-5" />
                    </button>
                </div>
            ) : (
                <div
                    onDragEnter={onDragEnter}
                    onDragLeave={onDragLeave}
                    onDragOver={onDragOver}
                    onDrop={onDrop}
                    className={`flex justify-center w-full px-6 pt-5 pb-6 mt-1 border-2 border-dashed rounded-lg transition-colors ${isDragging ? 'border-primary bg-primary/10' : 'border-neutral-600 hover:border-neutral-500'}`}
                >
                    <div className="space-y-1 text-center">
                        <UploadCloud className="w-12 h-12 mx-auto text-neutral-500"/>
                        <div className="flex text-sm text-neutral-400">
                            <label htmlFor={label} className="relative font-semibold rounded-md cursor-pointer text-primary-light hover:text-secondary focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-offset-neutral-900 focus-within:ring-primary">
                                <span>Upload a file</span>
                                <input ref={inputRef} id={label} name={label} type="file" className="sr-only" onChange={(e) => handleFileChange(e.target.files?.[0])} />
                            </label>
                            <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs text-neutral-500">PNG, JPG, PDF up to 10MB</p>
                    </div>
                </div>
            )}
        </div>
    );
};

const ExpenseForm: React.FC<ExpenseFormProps> = ({ categories, projects, sites, onSubmit, onClose }) => {
  const [categoryId, setCategoryId] = useState<string>(categories[0]?.id || '');
  const [subcategoryId, setSubcategoryId] = useState<string>('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState<string>(projects[0]?.id || '');
  const [siteId, setSiteId] = useState<string>(sites[0]?.id || '');
  const [attachment, setAttachment] = useState<File | undefined>(undefined);
  const [subcategoryAttachment, setSubcategoryAttachment] = useState<File | undefined>(undefined);
  const [error, setError] = useState('');

  const categoryAttachmentInputRef = useRef<HTMLInputElement>(null);
  const subcategoryAttachmentInputRef = useRef<HTMLInputElement>(null);

  const selectedCategory = categories.find(c => c.id === categoryId);
  const subcategoriesForSelectedCategory = selectedCategory?.subcategories || [];
  const selectedSubcategory = subcategoriesForSelectedCategory.find(sc => sc.id === subcategoryId);
  
  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCategoryId(e.target.value);
    setSubcategoryId('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (selectedCategory?.attachmentRequired && !attachment) {
      setError(`An attachment is required for the '${selectedCategory.name}' category.`);
      return;
    }
    
    if (selectedSubcategory?.attachmentRequired && !subcategoryAttachment) {
      setError(`An attachment is required for the '${selectedSubcategory.name}' subcategory.`);
      return;
    }
    
    if (!categoryId || !amount || !description || !projectId || !siteId) {
        setError("Please fill out all required fields.");
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

  const formInputStyle = "relative block w-full px-4 py-3 bg-neutral-900/50 border border-neutral-700 text-neutral-50 placeholder-neutral-400 rounded-md appearance-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-neutral-300">Category</label>
          <select id="category" value={categoryId} onChange={handleCategoryChange} required className={formInputStyle}>
            {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
          </select>
        </div>

        {subcategoriesForSelectedCategory.length > 0 && (
          <div>
              <label htmlFor="subcategory" className="block text-sm font-medium text-neutral-300">Subcategory</label>
              <select id="subcategory" value={subcategoryId} onChange={(e) => setSubcategoryId(e.target.value)} className={formInputStyle}>
                  <option value="">None</option>
                  {subcategoriesForSelectedCategory.map(subcat => <option key={subcat.id} value={subcat.id}>{subcat.name}</option>)}
              </select>
          </div>
        )}
      
        <div>
          <label htmlFor="projectId" className="block text-sm font-medium text-neutral-300">Project Name</label>
          <select id="projectId" value={projectId} onChange={(e) => setProjectId(e.target.value)} required className={formInputStyle}>
            {projects.map(proj => <option key={proj.id} value={proj.id}>{proj.name}</option>)}
          </select>
        </div>

         <div>
          <label htmlFor="siteId" className="block text-sm font-medium text-neutral-300">Site/Place</label>
          <select id="siteId" value={siteId} onChange={(e) => setSiteId(e.target.value)} required className={formInputStyle}>
            {sites.map(site => <option key={site.id} value={site.id}>{site.name}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label htmlFor="amount" className="block text-sm font-medium text-neutral-300">Amount (₹)</label>
        <div className="relative mt-1 rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <span className="text-neutral-400 sm:text-sm">₹</span>
            </div>
            <input type="number" id="amount" value={amount} onChange={(e) => setAmount(e.target.value)} required className={`${formInputStyle} pl-7`} placeholder="0.00" />
        </div>
      </div>
      
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-neutral-300">Description</label>
        <textarea id="description" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} required className={formInputStyle}></textarea>
      </div>

      <FileInput label="Category Attachment" file={attachment} setFile={setAttachment} inputRef={categoryAttachmentInputRef} isRequired={selectedCategory?.attachmentRequired} />
      
      {subcategoryId && (
        <FileInput label="Subcategory Attachment" file={subcategoryAttachment} setFile={setSubcategoryAttachment} inputRef={subcategoryAttachmentInputRef} isRequired={selectedSubcategory?.attachmentRequired} />
      )}

      {error && <p className="text-sm text-accent-danger">{error}</p>}
      
      <div className="pt-4 flex justify-end items-center space-x-3">
        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-semibold text-neutral-200 bg-neutral-800/50 border border-neutral-700 rounded-md hover:bg-neutral-700/50 transition-colors">Cancel</button>
        <button type="submit" className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-primary to-secondary rounded-md hover:opacity-90 transition-opacity">Submit Request</button>
      </div>
    </form>
  );
};

export default ExpenseForm;