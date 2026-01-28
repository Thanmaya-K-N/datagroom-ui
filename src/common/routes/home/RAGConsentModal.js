import React, { Component } from 'react';
import './RAGConsentModal.css';

class RAGConsentModal extends Component {
    render() {
        const { show, onHide, onConfirm, datasetName, loading } = this.props;

        if (!show) return null;

        return (
            <div className="rag-modal-overlay" onClick={onHide}>
                <div className="rag-modal-content" onClick={(e) => e.stopPropagation()}>
                    <div className="rag-modal-header">
                        <h4>
                            <i className="fas fa-magic" style={{ marginRight: '10px', color: '#4285f4' }}></i>
                            Enable AI Assistant
                        </h4>
                        <button className="rag-modal-close" onClick={onHide}>&times;</button>
                    </div>
                    <div className="rag-modal-body">
                        <p>
                            Shall I use the dataset <strong>{datasetName}</strong> to create embeddings 
                            so you can ask questions about it?
                        </p>
                        <p className="text-muted" style={{ fontSize: '0.9em' }}>
                            This will analyze your dataset and prepare it for AI-powered questions. 
                            The process may take a few moments depending on dataset size.
                        </p>
                    </div>
                    <div className="rag-modal-footer">
                        <button className="btn btn-secondary" onClick={onHide} disabled={loading}>
                            Cancel
                        </button>
                        <button 
                            className="btn btn-primary" 
                            onClick={onConfirm} 
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <span className="spinner-border spinner-border-sm" style={{ marginRight: '8px' }} role="status" aria-hidden="true"></span>
                                    Initializing...
                                </>
                            ) : (
                                'OK'
                            )}
                        </button>
                    </div>
                </div>
            </div>
        );
    }
}

export default RAGConsentModal;
