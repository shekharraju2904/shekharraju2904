import React, { Fragment } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="relative z-30" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="fixed inset-0 transition-opacity bg-neutral-500 bg-opacity-75 printable-modal-backdrop"></div>
      <div className="fixed inset-0 z-10 overflow-y-auto">
        <div className="flex items-end justify-center min-h-full p-4 text-center sm:items-center sm:p-0">
          <div className="relative px-4 pt-5 pb-4 overflow-hidden text-left transition-all transform bg-white rounded-2xl shadow-xl sm:my-8 sm:w-full sm:max-w-lg sm:p-6 printable-modal">
            <div className="absolute top-0 right-0 pt-4 pr-4 sm:block no-print">
                <button type="button" onClick={onClose} className="text-neutral-400 bg-white rounded-md hover:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">
                    <span className="sr-only">Close</span>
                    <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
            <div className="sm:flex sm:items-start">
              <div className="w-full mt-3 text-center sm:mt-0 sm:text-left">
                <h3 className="text-xl font-semibold leading-6 text-neutral-900 no-print" id="modal-title">{title}</h3>
                <div className="mt-4">
                    {children}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Modal;
