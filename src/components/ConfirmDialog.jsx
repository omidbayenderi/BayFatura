import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import '../index.css';

const ConfirmDialog = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Delete', cancelText = 'Cancel', type = 'danger' }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content confirm-dialog" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close" onClick={onClose}>
                    <X size={20} />
                </button>

                <div className="confirm-dialog-icon" style={{
                    backgroundColor: type === 'danger' ? '#fee2e2' : '#dbeafe',
                    color: type === 'danger' ? '#dc2626' : '#2563eb'
                }}>
                    <AlertTriangle size={32} />
                </div>

                <h2 className="confirm-dialog-title">{title}</h2>
                <p className="confirm-dialog-message">{message}</p>

                <div className="confirm-dialog-actions">
                    <button
                        className="btn btn-secondary"
                        onClick={onClose}
                    >
                        {cancelText}
                    </button>
                    <button
                        className={`btn ${type === 'danger' ? 'btn-danger' : 'btn-primary'}`}
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmDialog;
