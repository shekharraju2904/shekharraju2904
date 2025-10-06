import { User, Expense, Category, Role, Status } from './types';

// Placeholder for a real email sending service
export const sendEmailNotification = (to: User, subject: string, body: string) => {
  console.log(`
    ========================================
    📧 SIMULATING EMAIL NOTIFICATION 📧
    ----------------------------------------
    To: ${to.name} <${to.email}>
    Subject: ${subject}
    ----------------------------------------
    Body:
    ${body}
    ========================================
  `);
};

const formatDate = (isoString: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
};

const formatDateTime = (isoString: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `${formatDate(isoString)} ${hours}:${minutes}:${seconds}`;
};

const getExpenseDetailsForEmail = (expense: Expense, categoryName: string, subcategoryName: string | undefined, projectName: string, siteName: string, companyName: string): string => {
  return `
    Reference: ${expense.referenceNumber}
    Company: ${companyName}
    Project: ${projectName}
    Site/Place: ${siteName}
    Amount: ₹${expense.amount.toLocaleString('en-IN')}
    Category: ${categoryName}${subcategoryName ? ` / ${subcategoryName}` : ''}
    Description: ${expense.description}
    Submitted On: ${formatDateTime(expense.submittedAt)}
  `;
}

export const notifyRequestorOnSubmission = (requestor: User, expense: Expense, categoryName: string, subcategoryName: string | undefined, projectName: string, siteName: string, companyName: string) => {
    const subject = `✅ Your expense request ${expense.referenceNumber} has been submitted`;
    const body = `
        Hi ${requestor.name},

        This is a confirmation that your expense request has been successfully submitted.
        
        ${getExpenseDetailsForEmail(expense, categoryName, subcategoryName, projectName, siteName, companyName)}
        
        Current Status: ${expense.status}
        
        You will be notified of any status changes.
    `;
    sendEmailNotification(requestor, subject, body);
};

export const notifyVerifiersOnSubmission = (verifiers: User[], expense: Expense, categoryName: string, subcategoryName: string | undefined, projectName: string, siteName: string, companyName: string) => {
    const subject = `Action Required: New expense ${expense.referenceNumber} from ${expense.requestorName}`;
    const body = `
        Hello Team,

        A new expense request requires your verification.
        
        Requestor: ${expense.requestorName}
        ${getExpenseDetailsForEmail(expense, categoryName, subcategoryName, projectName, siteName, companyName)}
        
        Please log in to the portal to review and take action.
    `;
    verifiers.forEach(verifier => sendEmailNotification(verifier, subject, body));
};


export const notifyOnStatusChange = (
    requestor: User,
    expense: Expense,
    categoryName: string,
    subcategoryName: string | undefined,
    projectName: string,
    siteName: string,
    companyName: string,
    comment?: string
) => {
    let subject = '';
    let body = '';
    const expenseDetails = getExpenseDetailsForEmail(expense, categoryName, subcategoryName, projectName, siteName, companyName);

    switch(expense.status) {
        case Status.PENDING_APPROVAL:
            subject = `👍 Your expense request ${expense.referenceNumber} has been verified`;
            body = `
                Hi ${requestor.name},
                
                Good news! Your expense request has been verified and is now pending final approval.
                
                ${expenseDetails}
            `;
            break;
        case Status.APPROVED:
            subject = `🎉 Your expense request ${expense.referenceNumber} has been approved`;
            body = `
                Hi ${requestor.name},
                
                Your expense request has been approved. The amount will be reimbursed shortly.
                
                ${expenseDetails}
            `;
            break;
        case Status.REJECTED:
            subject = `❌ Your expense request ${expense.referenceNumber} has been rejected`;
            const reasonText = comment
                ? `Reason for rejection:\n"${comment}"\n`
                : 'No specific reason was provided.';
            
            body = `
                Hi ${requestor.name},
                
                Unfortunately, your expense request has been rejected.
                
                ${expenseDetails}
                
                ${reasonText}
                
                Please review the feedback and resubmit if necessary, or contact support for more details.
            `;
            break;
        default:
            return; // Don't send emails for other statuses from this function
    }
    
    sendEmailNotification(requestor, subject, body);
}


export const notifyApproversOnVerification = (approvers: User[], expense: Expense, categoryName: string, subcategoryName: string | undefined, projectName: string, siteName: string, companyName: string) => {
    const subject = `Action Required: Verified expense ${expense.referenceNumber} needs approval`;
    const body = `
        Hello Team,

        A verified expense request requires your final approval.
        
        Requestor: ${expense.requestorName}
        ${getExpenseDetailsForEmail(expense, categoryName, subcategoryName, projectName, siteName, companyName)}
        
        Please log in to the portal to review and take action.
    `;
    approvers.forEach(approver => sendEmailNotification(approver, subject, body));
};

export const notifyVerifierOnFinalAction = (
    verifier: User,
    approver: User,
    expense: Expense,
    categoryName: string,
    subcategoryName: string | undefined,
    projectName: string,
    siteName: string,
    companyName: string,
    comment?: string
) => {
    const statusText = expense.status === Status.APPROVED ? 'Approved' : 'Rejected';
    const subject = `Update on expense ${expense.referenceNumber} you verified`;
    const body = `
        Hi ${verifier.name},

        The expense request from ${expense.requestorName} that you verified has now been ${statusText.toLowerCase()} by ${approver.name}.

        ${getExpenseDetailsForEmail(expense, categoryName, subcategoryName, projectName, siteName, companyName)}

        Final Status: ${expense.status}
        ${comment ? `Approver/Rejector Comment: "${comment}"\n` : ''}
        This completes the workflow for this item. No further action is needed from you.
    `;
    sendEmailNotification(verifier, subject, body);
};

export const notifyOnNewComment = (recipients: User[], commenter: User, expense: Expense, comment: string) => {
    const subject = `💬 New comment on expense ${expense.referenceNumber}`;
    const body = `
        Hi,

        ${commenter.name} has added a new comment to expense request ${expense.referenceNumber}.
        
        Comment:
        "${comment}"
        
        Please log in to the portal to view the full conversation and take any necessary action.
    `;
    recipients.forEach(user => sendEmailNotification(user, subject, body));
};


export const sendBackupEmail = (admins: User[], backupData: string) => {
  const today = new Date();
  const dateStr = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
  const subject = `[AUTOMATED] ExpenseFlow Daily Backup for ${dateStr}`;
  const body = `
    Hi Admin,

    Attached is the automatic daily backup for the ExpenseFlow system, generated on ${formatDateTime(today.toISOString())}.

    This file contains all users, expenses, categories, projects, sites, and audit logs in JSON format.
    Please store it in a secure location.

    --- BACKUP DATA ---

    ${backupData}

    --- END OF BACKUP DATA ---
  `;
  
  admins.forEach(admin => sendEmailNotification(admin, subject, body));
};

export const notifyRequestorOnPayment = (requestor: User, expense: Expense) => {
    const subject = `💰 Your expense request ${expense.referenceNumber} has been paid`;
    const body = `
        Hi ${requestor.name},

        Your approved expense request has been processed and paid.
        
        Reference: ${expense.referenceNumber}
        Amount: ₹${expense.amount.toLocaleString('en-IN')}
        Payment Reference: ${expense.paymentReferenceNumber || 'N/A'}
        
        The amount has been reimbursed. You can view payment details in the portal.
    `;
    sendEmailNotification(requestor, subject, body);
};