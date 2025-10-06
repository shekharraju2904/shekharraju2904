import React, { useState } from 'react';
import { Expense, Status, Role, User, Category, Project, Site, Company } from '../types';
import { CheckCircleIcon, XCircleIcon, PaperClipIcon, ChevronDownIcon, PrinterIcon, StarIcon, TrashIcon, CreditCardIcon, UploadCloud, FileImage } from './Icons';
import { supabase } from '../supabaseClient';
import Avatar from './Avatar';

interface ExpenseCardProps {
  expense: Expense;
  categories: Category[];
  projects: Project[];
  sites: Site[];
  companies: Company[];
  userRole: Role;
  currentUser: User;
  onUpdateStatus?: (newStatus: Status, comment?: string) => void;
  onAddComment: (expenseId: string, comment: string) => void;
  onToggleExpensePriority: (expenseId: string) => void;
  onSoftDeleteExpense?: () => void;
  onMarkAsPaid?: (expenseId: string, attachment: File, paymentReferenceNumber: string) => void;
  onClose?: () => void;
}

const formatDate = (isoString: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const day = date.getDate().toString().padStart(2, '0');
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
};

const formatDateTime = (isoString: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    return `${formatDate(isoString)} at ${hours}:${minutes} ${ampm}`;
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
    if (underscoreIndex === -1) return fullName;
    return fullName.substring(underscoreIndex + 1);
};


const ExpenseCard: React.FC<ExpenseCardProps> = ({ 
    expense, categories, projects, sites, companies, userRole, currentUser,
    onUpdateStatus, onAddComment, onToggleExpensePriority, onSoftDeleteExpense, onMarkAsPaid, onClose 
}) => {
    const [rejectionComment, setRejectionComment] = useState('');
    const [showRejectionInput, setShowRejectionInput] = useState(false);
    const [newComment, setNewComment] = useState('');
    const [showHistory, setShowHistory] = useState(true);
    const [paymentAttachment, setPaymentAttachment] = useState<File | undefined>();
    const [paymentReference, setPaymentReference] = useState('');

    const handleApprove = () => {
        if (!onUpdateStatus) return;
        const newStatus = userRole === Role.VERIFIER ? Status.PENDING_APPROVAL : Status.APPROVED;
        onUpdateStatus(newStatus);
    };
    
    const handleReject = () => {
        if (!onUpdateStatus) return;
        onUpdateStatus(Status.REJECTED, rejectionComment);
    };

    const handleAddComment = (e: React.FormEvent) => {
        e.preventDefault();
        if (newComment.trim()) {
            onAddComment(expense.id, newComment);
            setNewComment('');
        }
    };
    
    const handleMarkAsPaid = () => {
        if (onMarkAsPaid && paymentAttachment && paymentReference.trim()) {
            onMarkAsPaid(expense.id, paymentAttachment, paymentReference.trim());
        } else {
            alert("Please attach payment proof and provide a payment reference number.");
        }
    };

    const handlePrint = () => window.print();
    
    const canTakeAction = (userRole === Role.VERIFIER && expense.status === Status.PENDING_VERIFICATION) ||
                          (userRole === Role.APPROVER && expense.status === Status.PENDING_APPROVAL);

    const canTogglePriority = [Role.ADMIN, Role.VERIFIER, Role.APPROVER].includes(userRole);
    
    const canMarkAsPaid = [Role.VERIFIER, Role.APPROVER, Role.ADMIN].includes(userRole) && expense.status === Status.APPROVED;

    const category = categories.find(c => c.id === expense.categoryId);
    const subcategory = category?.subcategories?.find(sc => sc.id === expense.subcategoryId);
    const projectName = projects.find(p => p.id === expense.projectId)?.name || 'N/A';
    const siteName = sites.find(s => s.id === expense.siteId)?.name || 'N/A';
    const companyName = companies.find(c => c.id === expense.companyId)?.name || 'N/A';
    const categoryDisplayName = `${category?.name || 'Unknown'}${subcategory ? ` / ${subcategory.name}` : ''}`;

    const attachmentUrl = getAttachmentUrl(expense.attachment_path);
    const attachmentName = cleanFileName(expense.attachment_path);
    
    const subAttachmentUrl = getAttachmentUrl(expense.subcategory_attachment_path);
    const subAttachmentName = cleanFileName(expense.subcategory_attachment_path);
    
    const paymentAttachmentUrl = getAttachmentUrl(expense.payment_attachment_path);
    const paymentAttachmentName = cleanFileName(expense.payment_attachment_path);

    const formInputStyle = "relative block w-full px-3 py-2 bg-neutral-800 border border-neutral-600 text-neutral-50 placeholder-neutral-400 rounded-md appearance-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm";

    return (
        <div className="space-y-6 max-h-[80vh] overflow-y-auto pr-2">
            <div className="no-print sticky top-0 bg-neutral-800/80 backdrop-blur-lg py-2 -mx-6 px-6 z-10">
                 <div className="flex items-start justify-between">
                    <div>
                        <p className="text-sm text-neutral-400">Requestor</p>
                        <p className="font-semibold text-neutral-100">{expense.requestorName}</p>
                    </div>
                     <div className="text-right">
                         <p className="text-sm text-neutral-400">Amount</p>
                        <p className="font-bold text-2xl text-transparent bg-gradient-to-r from-primary-light to-secondary bg-clip-text">₹{expense.amount.toLocaleString('en-IN')}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
                <div><p className="font-medium text-neutral-400">Company</p><p className="text-neutral-100">{companyName}</p></div>
                <div><p className="font-medium text-neutral-400">Project</p><p className="text-neutral-100">{projectName}</p></div>
                <div><p className="font-medium text-neutral-400">Site/Place</p><p className="text-neutral-100">{siteName}</p></div>
                <div className="col-span-full"><p className="font-medium text-neutral-400">Category</p><p className="text-neutral-100">{categoryDisplayName}</p></div>
            </div>

            <div className="p-4 bg-neutral-900/50 border border-neutral-700 rounded-lg">
                <p className="text-sm font-medium text-neutral-300">Description</p>
                <p className="mt-1 text-sm text-neutral-100 whitespace-pre-wrap">{expense.description}</p>
            </div>
            
            {(attachmentUrl || subAttachmentUrl) && (
                <div className="space-y-2">
                    <p className="text-sm font-medium text-neutral-300">Attachments</p>
                     <div className="flex flex-col space-y-2">
                        {attachmentUrl && (
                            <a href={attachmentUrl} download={attachmentName} target="_blank" rel="noopener noreferrer" className="inline-flex items-center p-2 text-sm text-neutral-300 bg-neutral-900/50 border border-neutral-700 rounded-md hover:bg-neutral-700/50 transition-colors">
                                <PaperClipIcon className="w-4 h-4 mr-2 text-neutral-400" />
                                <span className="truncate">{attachmentName || 'Category Attachment'}</span>
                            </a>
                        )}
                        {subAttachmentUrl && (
                             <a href={subAttachmentUrl} download={subAttachmentName} target="_blank" rel="noopener noreferrer" className="inline-flex items-center p-2 text-sm text-neutral-300 bg-neutral-900/50 border border-neutral-700 rounded-md hover:bg-neutral-700/50 transition-colors">
                                <PaperClipIcon className="w-4 h-4 mr-2 text-neutral-400" />
                                <span className="truncate">{subAttachmentName || 'Subcategory Attachment'}</span>
                            </a>
                        )}
                     </div>
                </div>
            )}
            
             {expense.status === Status.APPROVED && (
                <div className="p-4 bg-neutral-900/50 border border-neutral-700 rounded-lg">
                    <h4 className="text-sm font-medium text-neutral-300">Payment Status</h4>
                    <div className="mt-2 text-sm text-accent">Awaiting Payment</div>

                    {canMarkAsPaid && (
                        <div className="mt-4 pt-4 border-t border-neutral-600">
                            <h5 className="font-semibold text-neutral-100">Process Payment</h5>
                            <div className="mt-2 space-y-4">
                                <div>
                                    <label htmlFor="payment-reference" className="block text-sm font-medium text-neutral-300 mb-1">Payment Reference # <span className="text-accent-danger">*</span></label>
                                    <input
                                        type="text"
                                        id="payment-reference"
                                        value={paymentReference}
                                        onChange={(e) => setPaymentReference(e.target.value)}
                                        required
                                        className={formInputStyle}
                                        placeholder="e.g., UTR, transaction ID"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-neutral-300 mb-1">Payment Proof <span className="text-accent-danger">*</span></label>
                                    {paymentAttachment ? (
                                        <div className="relative flex items-center p-3 bg-neutral-900 border border-neutral-600 rounded-lg">
                                            <FileImage className="w-8 h-8 mr-3 text-neutral-400" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-neutral-100 truncate">{paymentAttachment.name}</p>
                                                <p className="text-xs text-neutral-400">{(paymentAttachment.size / 1024).toFixed(1)} KB</p>
                                            </div>
                                            <button type="button" onClick={() => setPaymentAttachment(undefined)} className="ml-2 p-1 text-neutral-400 rounded-full hover:bg-neutral-700 hover:text-white">
                                                <XCircleIcon className="w-5 h-5" />
                                            </button>
                                        </div>
                                    ) : (
                                        <label htmlFor="payment-attachment" className="flex justify-center w-full px-6 py-4 border-2 border-dashed rounded-lg cursor-pointer border-neutral-600 hover:border-neutral-500">
                                            <div className="text-center">
                                                <UploadCloud className="w-8 h-8 mx-auto text-neutral-500"/>
                                                <span className="mt-2 block text-sm font-semibold text-primary-light">Upload File</span>
                                                <input id="payment-attachment" type="file" className="sr-only" onChange={(e) => setPaymentAttachment(e.target.files?.[0])} />
                                            </div>
                                        </label>
                                    )}
                                </div>
                            </div>

                            <div className="mt-4 flex justify-end">
                                <button onClick={handleMarkAsPaid} disabled={!paymentAttachment || !paymentReference.trim()} className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-white bg-success/80 border border-transparent rounded-md shadow-sm hover:bg-success disabled:opacity-50 disabled:cursor-not-allowed">
                                    <CreditCardIcon className="w-5 h-5 mr-2"/>
                                    Confirm Payment
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {expense.status === Status.PAID && (
                <div className="p-4 bg-neutral-900/50 border border-teal-500/30 rounded-lg">
                    <h4 className="text-sm font-medium text-teal-300">Payment Processed</h4>
                    <div className="mt-2 text-sm space-y-1">
                        <p><span className="text-neutral-400">Paid on:</span> {formatDateTime(expense.paidAt!)}</p>
                        {expense.paymentReferenceNumber && <p><span className="text-neutral-400">Reference #:</span> {expense.paymentReferenceNumber}</p>}
                        {paymentAttachmentUrl && (
                            <a href={paymentAttachmentUrl} download={paymentAttachmentName} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-3 py-1 mt-2 text-sm text-neutral-300 bg-neutral-700/50 border border-neutral-600 rounded-md hover:bg-neutral-700 transition-colors">
                                <PaperClipIcon className="w-4 h-4"/>
                                View Payment Proof
                            </a>
                        )}
                    </div>
                </div>
            )}

            <div>
                <button onClick={() => setShowHistory(!showHistory)} className="flex items-center justify-between w-full text-sm font-medium text-left text-neutral-400 hover:text-neutral-100">
                    <span>History & Comments</span>
                    <ChevronDownIcon className={`w-5 h-5 transition-transform ${showHistory ? 'rotate-180' : ''}`} />
                </button>
                {showHistory && (
                    <div className="pt-4 mt-2 space-y-4 border-t border-neutral-700">
                        {expense.history.map((item, index) => {
                            const isComment = item.action === 'Comment';
                            const isCurrentUser = item.actorId === currentUser.id;
                            
                            return (
                                <div key={index} className={`flex items-start gap-3 ${isCurrentUser && isComment ? 'justify-end' : ''}`}>
                                    {(!isCurrentUser || !isComment) && item.actorId !== 'system' && <Avatar name={item.actorName} size="sm" />}
                                    <div className={`flex flex-col w-full ${isComment ? 'max-w-xs' : ''} leading-1.5 p-3 rounded-xl ${isCurrentUser && isComment ? 'bg-primary text-white rounded-br-none' : 'bg-neutral-900/50 text-neutral-100 rounded-bl-none'}`}>
                                        <div className="flex items-center space-x-2 rtl:space-x-reverse">
                                            <span className="text-sm font-semibold">{item.actorName}</span>
                                            <span className={`text-xs font-normal ${isCurrentUser && isComment ? 'text-primary-light' : 'text-neutral-500'}`}>{formatDateTime(item.timestamp)}</span>
                                        </div>
                                        <p className={`py-2 text-sm font-normal ${isComment ? '' : 'font-semibold'}`}>{isComment ? item.comment : item.action}</p>
                                        {item.comment && !isComment && <p className="text-xs italic text-neutral-400">"{item.comment}"</p>}
                                    </div>
                                    {isCurrentUser && isComment && <Avatar name={currentUser.name} size="sm" />}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <div className="pt-4 border-t border-neutral-700 no-print">
                <form onSubmit={handleAddComment}>
                    <div className="flex mt-1 space-x-2">
                        <input
                            type="text"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            className="block w-full px-4 py-2 bg-neutral-900/50 border border-neutral-700 rounded-md focus:ring-primary focus:border-primary sm:text-sm"
                            placeholder="Add a comment..."
                        />
                         <button type="submit" className="px-4 py-2 text-sm font-semibold text-white border border-transparent rounded-md bg-primary hover:bg-primary/90">Send</button>
                    </div>
                </form>
            </div>

            <div className="pt-4 mt-4 border-t border-neutral-700 no-print">
                 <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <button type="button" onClick={handlePrint} className="p-2 text-neutral-400 rounded-md hover:bg-neutral-700 hover:text-white"><PrinterIcon /></button>
                         {canTogglePriority && (
                            <button onClick={() => onToggleExpensePriority(expense.id)} className={`p-2 rounded-md transition-colors ${expense.isHighPriority ? 'text-accent bg-accent/20' : 'text-neutral-400 hover:bg-neutral-700 hover:text-white'}`} title={expense.isHighPriority ? "High Priority" : "Mark as High Priority"}>
                                <StarIcon fill={expense.isHighPriority ? "currentColor" : "none"} />
                            </button>
                        )}
                         {userRole === Role.ADMIN && onSoftDeleteExpense && (
                            <button type="button" onClick={onSoftDeleteExpense} className="p-2 text-neutral-400 rounded-md hover:bg-accent-danger/20 hover:text-accent-danger"><TrashIcon /></button>
                        )}
                    </div>

                    <div className="flex items-center space-x-3">
                        {canTakeAction && !showRejectionInput && (
                             <>
                                <button onClick={() => setShowRejectionInput(true)} className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-white bg-accent-danger/80 border border-transparent rounded-md shadow-sm hover:bg-accent-danger">
                                    <XCircleIcon className="w-5 h-5 mr-2" />
                                    Reject
                                </button>
                                <button onClick={handleApprove} className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-white bg-success/80 border border-transparent rounded-md shadow-sm hover:bg-success">
                                    <CheckCircleIcon className="w-5 h-5 mr-2" />
                                    {userRole === Role.VERIFIER ? 'Verify' : 'Approve'}
                                </button>
                            </>
                        )}
                    </div>
                </div>
                 {canTakeAction && showRejectionInput && (
                    <div className="p-4 mt-4 bg-accent-danger/10 border border-accent-danger/30 rounded-lg">
                        <label htmlFor="rejection_comment" className="block text-sm font-medium text-neutral-100">Rejection Reason (Optional)</label>
                        <textarea
                            id="rejection_comment"
                            rows={2}
                            value={rejectionComment}
                            onChange={(e) => setRejectionComment(e.target.value)}
                            className="block w-full mt-1 bg-neutral-900/50 border-neutral-700 rounded-md focus:ring-accent-danger focus:border-accent-danger sm:text-sm"
                            placeholder="Provide a reason for rejection..."
                        ></textarea>
                        <div className="flex justify-end mt-2 space-x-2">
                            <button onClick={() => setShowRejectionInput(false)} className="px-3 py-1 text-sm text-neutral-300 rounded-md hover:bg-neutral-700">Cancel</button>
                            <button onClick={handleReject} className="px-3 py-1 text-sm font-medium text-white bg-accent-danger rounded-md hover:bg-accent-danger/90">
                                Confirm Reject
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ExpenseCard;