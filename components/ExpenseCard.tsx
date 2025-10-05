import React, { useState } from 'react';
import { Expense, Status, Role, User, Category, Project, Site } from '../types';
import { CheckCircleIcon, XCircleIcon, PaperClipIcon, ChevronDownIcon, DocumentArrowDownIcon, PrinterIcon, StarIcon, TrashIcon } from './Icons';
import { supabase } from '../supabaseClient';
import Avatar from './Avatar';

interface ExpenseCardProps {
  expense: Expense;
  categories: Category[];
  projects: Project[];
  sites: Site[];
  userRole: Role;
  currentUser: User;
  onUpdateStatus?: (newStatus: Status, comment?: string) => void;
  onAddComment: (expenseId: string, comment: string) => void;
  onToggleExpensePriority: (expenseId: string) => void;
  onSoftDeleteExpense?: () => void;
  onClose?: () => void;
}

const formatDate = (isoString: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const day = date.getDate().toString().padStart(2, '0');
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
};

const formatDateTime = (isoString: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${formatDate(isoString)} ${hours}:${minutes}`;
};

const getAttachmentUrl = (path: string | null): string | null => {
    if (!path) return null;
    const { data } = supabase.storage.from('attachments').getPublicUrl(path);
    return data.publicUrl;
};

const cleanFileName = (path: string | null | undefined): string | undefined => {
    if (!path) return undefined;
    const parts = path.split('/');
    const fullName = parts[parts.length - 1];
    const underscoreIndex = fullName.indexOf('_');
    if (underscoreIndex === -1) return fullName; // Fallback if format is unexpected
    return fullName.substring(underscoreIndex + 1);
};


const ExpenseCard: React.FC<ExpenseCardProps> = ({ 
    expense, categories, projects, sites, userRole, currentUser,
    onUpdateStatus, onAddComment, onToggleExpensePriority, onSoftDeleteExpense, onClose 
}) => {
    const [rejectionComment, setRejectionComment] = useState('');
    const [showRejectionInput, setShowRejectionInput] = useState(false);
    const [newComment, setNewComment] = useState('');
    const [showHistory, setShowHistory] = useState(true);

    const handleApprove = () => {
        if (!onUpdateStatus) return;
        const newStatus = userRole === Role.VERIFIER ? Status.PENDING_APPROVAL : Status.APPROVED;
        const actionText = userRole === Role.VERIFIER ? 'verify' : 'approve';
        if (window.confirm(`Are you sure you want to ${actionText} this expense?`)) {
            onUpdateStatus(newStatus);
        }
    };
    
    const handleReject = () => {
        if (!onUpdateStatus) return;
        if (window.confirm('Are you sure you want to reject this expense?')) {
            onUpdateStatus(Status.REJECTED, rejectionComment);
        }
    };

    const handleAddComment = (e: React.FormEvent) => {
        e.preventDefault();
        if (newComment.trim()) {
            onAddComment(expense.id, newComment);
            setNewComment('');
        }
    };

    const handlePrint = () => {
        window.print();
    };
    
    const canTakeAction = (userRole === Role.VERIFIER && expense.status === Status.PENDING_VERIFICATION) ||
                          (userRole === Role.APPROVER && expense.status === Status.PENDING_APPROVAL);

    const canTogglePriority = [Role.ADMIN, Role.VERIFIER, Role.APPROVER].includes(userRole);

    const category = categories.find(c => c.id === expense.categoryId);
    const subcategory = category?.subcategories?.find(sc => sc.id === expense.subcategoryId);
    const projectName = projects.find(p => p.id === expense.projectId)?.name || 'N/A';
    const siteName = sites.find(s => s.id === expense.siteId)?.name || 'N/A';
    const categoryDisplayName = `${category?.name || 'Unknown'}${subcategory ? ` / ${subcategory.name}` : ''}`;

    const attachmentUrl = getAttachmentUrl(expense.attachment_path);
    const attachmentName = cleanFileName(expense.attachment_path);
    
    const subAttachmentUrl = getAttachmentUrl(expense.subcategory_attachment_path);
    const subAttachmentName = cleanFileName(expense.subcategory_attachment_path);

    return (
        <div className="space-y-6">
            <div className="flex items-start justify-between">
                <div>
                    <p className="font-mono text-neutral-800">{expense.referenceNumber}</p>
                    <p className="text-sm text-neutral-500">Submitted on {formatDateTime(expense.submittedAt)}</p>
                </div>
                {canTogglePriority && (
                     <button onClick={() => onToggleExpensePriority(expense.id)} className={`p-1.5 rounded-full transition-colors ${expense.isHighPriority ? 'text-amber-500 bg-amber-100' : 'text-neutral-400 hover:bg-neutral-100'}`} title={expense.isHighPriority ? "Remove High Priority" : "Mark as High Priority"}>
                        <StarIcon filled={expense.isHighPriority} className="w-5 h-5" />
                    </button>
                )}
            </div>
            
            <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
                <div className="font-medium text-neutral-500">Requestor</div>
                <div className="text-neutral-800 font-medium">{expense.requestorName}</div>
                
                <div className="font-medium text-neutral-500">Amount</div>
                <div className="font-semibold text-2xl text-primary-700">₹{expense.amount.toLocaleString('en-IN')}</div>

                <div className="font-medium text-neutral-500">Project</div>
                <div className="text-neutral-800">{projectName}</div>

                <div className="font-medium text-neutral-500">Site/Place</div>
                <div className="text-neutral-800">{siteName}</div>

                <div className="font-medium text-neutral-500 col-span-2">Category</div>
                <div className="text-neutral-800 col-span-2">{categoryDisplayName}</div>
            </div>

            <div className="p-4 bg-neutral-50 rounded-lg">
                <p className="text-sm font-medium text-neutral-800">Description</p>
                <p className="mt-1 text-sm text-neutral-600 whitespace-pre-wrap">{expense.description}</p>
            </div>
            
            {(attachmentUrl || subAttachmentUrl) && (
                <div className="space-y-2">
                    <p className="text-sm font-medium text-neutral-800">Attachments</p>
                     <div className="flex flex-col space-y-2">
                        {attachmentUrl && (
                            <a href={attachmentUrl} download={attachmentName} target="_blank" rel="noopener noreferrer" className="inline-flex items-center p-2 text-sm text-neutral-700 bg-white border border-neutral-300 rounded-md hover:bg-neutral-50 transition-colors">
                                <PaperClipIcon className="w-4 h-4 mr-2 text-neutral-400" />
                                <span className="truncate">{attachmentName || 'Category Attachment'}</span>
                            </a>
                        )}
                        {subAttachmentUrl && (
                             <a href={subAttachmentUrl} download={subAttachmentName} target="_blank" rel="noopener noreferrer" className="inline-flex items-center p-2 text-sm text-neutral-700 bg-white border border-neutral-300 rounded-md hover:bg-neutral-50 transition-colors">
                                <PaperClipIcon className="w-4 h-4 mr-2 text-neutral-400" />
                                <span className="truncate">{subAttachmentName || 'Subcategory Attachment'}</span>
                            </a>
                        )}
                     </div>
                </div>
            )}
            
            <div>
                <button onClick={() => setShowHistory(!showHistory)} className="flex items-center justify-between w-full text-sm font-medium text-left text-neutral-600 hover:text-neutral-900">
                    <span>Approval History & Comments</span>
                    <ChevronDownIcon className={`w-5 h-5 transition-transform ${showHistory ? 'rotate-180' : ''}`} />
                </button>
                {showHistory && (
                    <div className="pt-4 mt-2 space-y-4 border-t border-neutral-200">
                        {expense.history.map((item, index) => {
                            const isComment = item.action === 'Comment';
                            const isCurrentUser = item.actorId === currentUser.id;
                            
                            if (isComment) {
                                return (
                                    <div key={index} className={`flex items-start gap-3 ${isCurrentUser ? 'justify-end' : ''}`}>
                                        {!isCurrentUser && item.actorId !== 'system' && <Avatar name={item.actorName} size="sm" />}
                                        <div className={`flex flex-col w-full max-w-xs leading-1.5 p-3 rounded-xl ${isCurrentUser ? 'bg-primary-600 text-white rounded-br-none' : 'bg-neutral-100 text-neutral-900 rounded-bl-none'}`}>
                                            <div className="flex items-center space-x-2 rtl:space-x-reverse">
                                                <span className={`text-sm font-semibold`}>{item.actorName}</span>
                                                <span className={`text-xs font-normal ${isCurrentUser ? 'text-primary-200' : 'text-neutral-500'}`}>{formatDateTime(item.timestamp)}</span>
                                            </div>
                                            {item.comment && <p className="py-2 text-sm font-normal">{item.comment}</p>}
                                        </div>
                                        {isCurrentUser && <Avatar name={currentUser.name} size="sm" />}
                                    </div>
                                );
                            } else {
                                // System action
                                return (
                                    <div key={index} className="flex items-center w-full">
                                        <div className="w-full h-px bg-neutral-200"></div>
                                        <div className="px-3 text-center shrink-0">
                                            <p className="text-sm font-medium text-neutral-700">{item.action} by {item.actorName}</p>
                                            <p className="text-xs text-neutral-500 whitespace-nowrap">{formatDateTime(item.timestamp)}</p>
                                            {item.comment && <p className="max-w-xs mx-auto text-xs italic text-neutral-500">"{item.comment}"</p>}
                                        </div>
                                        <div className="w-full h-px bg-neutral-200"></div>
                                    </div>
                                );
                            }
                        })}
                    </div>
                )}
            </div>

            <div className="pt-4 border-t no-print">
                <form onSubmit={handleAddComment}>
                    <label htmlFor="add-comment" className="block text-sm font-medium text-neutral-700">Add a Comment</label>
                    <div className="flex mt-1 space-x-2">
                        <textarea
                            id="add-comment"
                            rows={2}
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            className="block w-full border-neutral-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                            placeholder="Type your comment here..."
                        ></textarea>
                         <button type="submit" className="px-4 py-2 text-sm font-medium text-white border border-transparent rounded-md shadow-sm bg-primary-600 hover:bg-primary-700">Send</button>
                    </div>
                </form>
            </div>

            <div className="pt-4 mt-4 border-t no-print">
                 <div className="flex items-center">
                    <button
                        type="button"
                        onClick={handlePrint}
                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-md shadow-sm hover:bg-neutral-50"
                    >
                        <PrinterIcon className="w-5 h-5 mr-2" />
                        Print
                    </button>

                    <div className="flex items-center ml-auto space-x-3">
                        {userRole === Role.ADMIN && onSoftDeleteExpense && (
                            <button
                                type="button"
                                onClick={onSoftDeleteExpense}
                                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-accent-600 border border-transparent rounded-md shadow-sm hover:bg-accent-700"
                            >
                                <TrashIcon className="w-5 h-5 mr-2" />
                                Delete
                            </button>
                        )}
                        {canTakeAction ? (
                            <div>
                                {showRejectionInput ? (
                                    <div>
                                        <label htmlFor="rejection_comment" className="block text-sm font-medium text-neutral-700">Rejection Reason</label>
                                        <textarea
                                            id="rejection_comment"
                                            rows={2}
                                            value={rejectionComment}
                                            onChange={(e) => setRejectionComment(e.target.value)}
                                            className="block w-full mt-1 border-neutral-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                            placeholder="Provide a reason for rejection (optional)"
                                        ></textarea>
                                        <div className="flex justify-end mt-2 space-x-2">
                                            <button onClick={() => setShowRejectionInput(false)} className="px-3 py-1 text-sm text-neutral-700 bg-white border border-neutral-300 rounded-md">Cancel</button>
                                            <button onClick={handleReject} className="inline-flex items-center px-3 py-1 text-sm font-medium text-white bg-accent-600 border border-transparent rounded-md shadow-sm hover:bg-accent-700">
                                                Confirm Rejection
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex justify-end space-x-3">
                                        <button onClick={() => setShowRejectionInput(true)} className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-accent-600 border border-transparent rounded-md shadow-sm hover:bg-accent-700">
                                            <XCircleIcon className="w-5 h-5 mr-2" />
                                            Reject
                                        </button>
                                        <button onClick={handleApprove} className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-success-600 border border-transparent rounded-md shadow-sm hover:bg-success-700">
                                            <CheckCircleIcon className="w-5 h-5 mr-2" />
                                            {userRole === Role.VERIFIER ? 'Verify' : 'Approve'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            onClose && <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-md shadow-sm hover:bg-neutral-50">Close</button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExpenseCard;