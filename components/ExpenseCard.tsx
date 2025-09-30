import React, { useState } from 'react';
import { Expense, Status, Role, Category } from '../types';
import { CheckCircleIcon, XCircleIcon, PaperClipIcon, ChevronDownIcon, DocumentArrowDownIcon, PrinterIcon } from './Icons';

interface ExpenseCardProps {
  expense: Expense;
  categories: Category[];
  userRole?: Role;
  onUpdateStatus?: (newStatus: Status, comment?: string) => void;
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
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `${formatDate(isoString)} ${hours}:${minutes}:${seconds}`;
};


const ExpenseCard: React.FC<ExpenseCardProps> = ({ expense, categories, userRole, onUpdateStatus, onClose }) => {
    const [rejectionComment, setRejectionComment] = useState('');
    const [showRejectionInput, setShowRejectionInput] = useState(false);
    const [showHistory, setShowHistory] = useState(true);

    const category = categories.find(c => c.id === expense.categoryId);
    const categoryName = category?.name || 'Unknown';
    const subcategoryName = category?.subcategories?.find(sc => sc.id === expense.subcategoryId)?.name;


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

    const handlePrint = () => {
        window.print();
    };
    
    const canTakeAction = (userRole === Role.VERIFIER && expense.status === Status.PENDING_VERIFICATION) ||
                          (userRole === Role.APPROVER && expense.status === Status.PENDING_APPROVAL);

    return (
        <div className="space-y-4">
            <div className="flex items-start justify-between">
                <div>
                    <h4 className="font-medium text-gray-800">Requestor: <span className="font-normal text-gray-600">{expense.requestorName}</span></h4>
                    <h4 className="font-medium text-gray-800">Project: <span className="font-normal text-gray-600">{expense.projectName}</span></h4>
                    <h4 className="font-medium text-gray-800">Site/Place: <span className="font-normal text-gray-600">{expense.sitePlace}</span></h4>
                    <h4 className="font-medium text-gray-800">Category: <span className="font-normal text-gray-600">{categoryName}</span></h4>
                    {subcategoryName && <h4 className="font-medium text-gray-800">Subcategory: <span className="font-normal text-gray-600">{subcategoryName}</span></h4>}
                    <h4 className="font-medium text-gray-800">Amount: <span className="font-normal text-gray-600">₹{expense.amount.toLocaleString('en-IN')}</span></h4>
                    <h4 className="font-medium text-gray-800">Submitted: <span className="font-normal text-gray-600">{formatDateTime(expense.submittedAt)}</span></h4>
                </div>
                <div className="pl-4 text-right">
                    <p className="text-sm font-semibold text-gray-500">Reference #</p>
                    <p className="font-mono text-gray-800">{expense.referenceNumber}</p>
                </div>
            </div>

            <div className="p-3 bg-gray-50 rounded-md">
                <p className="text-sm font-medium text-gray-800">Description</p>
                <p className="mt-1 text-sm text-gray-600">{expense.description}</p>
            </div>
            
            {expense.attachment && (
                <div className="p-3 border rounded-md">
                     <a 
                        href={`data:${expense.attachment.type};base64,${expense.attachment.data}`} 
                        download={expense.attachment.name} 
                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-white border border-transparent rounded-md shadow-sm bg-primary hover:bg-primary-hover"
                    >
                        <DocumentArrowDownIcon className="w-5 h-5 mr-2" />
                        Download Category Attachment ({expense.attachment.name})
                    </a>
                </div>
            )}
            
            {expense.subcategoryAttachment && (
                <div className="p-3 border rounded-md">
                     <a 
                        href={`data:${expense.subcategoryAttachment.type};base64,${expense.subcategoryAttachment.data}`} 
                        download={expense.subcategoryAttachment.name} 
                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-white border border-transparent rounded-md shadow-sm bg-secondary hover:bg-green-600"
                    >
                        <DocumentArrowDownIcon className="w-5 h-5 mr-2" />
                        Download Subcategory Attachment ({expense.subcategoryAttachment.name})
                    </a>
                </div>
            )}
            
             <div>
                <button onClick={() => setShowHistory(!showHistory)} className="flex items-center justify-between w-full text-sm font-medium text-left text-gray-600 hover:text-gray-900">
                    <span>Approval History</span>
                    <ChevronDownIcon className={`w-5 h-5 transition-transform ${showHistory ? 'rotate-180' : ''}`} />
                </button>
                {showHistory && (
                    <div className="mt-2 space-y-2 border-l-2 border-gray-200 pl-4">
                        {expense.history.map((item, index) => (
                            <div key={index}>
                                <p className="text-sm font-medium text-gray-800">{item.action} by {item.actorName}</p>
                                <p className="text-xs text-gray-500">{formatDateTime(item.timestamp)}</p>
                                {item.comment && <p className="pl-2 mt-1 text-xs italic text-gray-600 border-l-2 border-gray-300">"{item.comment}"</p>}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Action buttons footer */}
            <div className="pt-4 mt-4 border-t no-print">
                 <div className="flex items-center">
                    <button
                        type="button"
                        onClick={handlePrint}
                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
                    >
                        <PrinterIcon className="w-5 h-5 mr-2" />
                        Print
                    </button>

                    <div className="ml-auto">
                        {canTakeAction ? (
                            <div>
                                {showRejectionInput ? (
                                    <div>
                                        <label htmlFor="rejection_comment" className="block text-sm font-medium text-gray-700">Rejection Reason</label>
                                        <textarea
                                            id="rejection_comment"
                                            rows={2}
                                            value={rejectionComment}
                                            onChange={(e) => setRejectionComment(e.target.value)}
                                            className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                                            placeholder="Provide a reason for rejection (optional)"
                                        ></textarea>
                                        <div className="flex justify-end mt-2 space-x-2">
                                            <button onClick={() => setShowRejectionInput(false)} className="px-3 py-1 text-sm text-gray-700 bg-white border border-gray-300 rounded-md">Cancel</button>
                                            <button onClick={handleReject} className="inline-flex items-center px-3 py-1 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md shadow-sm hover:bg-red-700">
                                                Confirm Rejection
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex justify-end space-x-3">
                                        <button onClick={() => setShowRejectionInput(true)} className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md shadow-sm hover:bg-red-700">
                                            <XCircleIcon className="w-5 h-5 mr-2" />
                                            Reject
                                        </button>
                                        <button onClick={handleApprove} className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md shadow-sm hover:bg-green-700">
                                            <CheckCircleIcon className="w-5 h-5 mr-2" />
                                            {userRole === Role.VERIFIER ? 'Verify' : 'Approve'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            onClose && <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50">Close</button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExpenseCard;