import React from 'react';

interface ModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose: () => void;
}

export function Modal({ isOpen, title, message, type = 'info', onClose }: ModalProps) {
  if (!isOpen) return null;

  const typeConfig = {
    success: { border: '#10B981', bg: '#D1FAE5', text: '#065F46' },
    error: { border: '#EF4444', bg: '#FEE2E2', text: '#991B1B' },
    info: { border: '#3B82F6', bg: '#DBEAFE', text: '#1E40AF' }
  };

  const config = typeConfig[type];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden transform transition-all">
        <div 
          className="p-1" 
          style={{ backgroundColor: config.border }} 
        />
        <div className="p-6">
          <h3 className="text-xl font-semibold mb-2" style={{ color: '#231F20' }}>
            {title}
          </h3>
          <p className="text-gray-600 mb-6 text-sm whitespace-pre-line">
            {message}
          </p>
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 rounded-lg font-medium transition-colors"
              style={{ backgroundColor: config.border, color: 'white' }}
            >
              OK
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
