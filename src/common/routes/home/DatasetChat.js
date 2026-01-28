import React, { Component } from 'react';
import { ragService } from '../../services/rag.service';
import './DatasetChat.css';

class DatasetChat extends Component {
    constructor(props) {
        super(props);
        this.state = {
            messages: [],
            input: '',
            loading: false,
            error: null,
            reinitializing: false,
            initializing: false,
            embeddingsReady: false,
            checkingStatus: true
        };
        this.messageEndRef = React.createRef();
    }

    componentDidMount() {
        // Check and auto-initialize embeddings when component mounts
        this.checkAndInitializeEmbeddings();
    }

    componentDidUpdate(prevProps, prevState) {
        // Re-check if dataset changed
        if (prevProps.datasetId !== this.props.datasetId) {
            this.checkAndInitializeEmbeddings();
        }
        
        // Auto-scroll to bottom when new messages arrive
        if (prevState.messages.length !== this.state.messages.length) {
            this.scrollToBottom();
        }
    }

    checkAndInitializeEmbeddings = async () => {
        const { datasetId } = this.props;
        
        this.setState({ checkingStatus: true, error: null });

        try {
            // Check if embeddings exist
            const status = await ragService.checkStatus(datasetId);
            
            if (status.hasEmbeddings) {
                console.log('Embeddings already exist for dataset:', datasetId);
                this.setState({ 
                    embeddingsReady: true,
                    checkingStatus: false 
                });
            } else {
                console.log('No embeddings found, auto-initializing for dataset:', datasetId);
                // Auto-initialize embeddings
                await this.autoInitializeEmbeddings();
            }
        } catch (error) {
            console.error('Error checking embeddings status:', error);
            this.setState({
                error: 'Failed to check embeddings status. Please try refreshing.',
                checkingStatus: false
            });
        }
    };

    autoInitializeEmbeddings = async () => {
        const { datasetId } = this.props;
        
        this.setState({ initializing: true, error: null, checkingStatus: false });

        try {
            console.log('Auto-initializing embeddings for dataset:', datasetId);
            await ragService.initialize(datasetId);
            
            this.setState({ 
                initializing: false,
                embeddingsReady: true
            });
            
            console.log('Embeddings initialized successfully!');
        } catch (error) {
            console.error('Error auto-initializing embeddings:', error);
            this.setState({
                error: 'Failed to initialize embeddings: ' + error.toString() + '. Try clicking "Refresh Data".',
                initializing: false,
                embeddingsReady: false
            });
        }
    };



    scrollToBottom = () => {
        if (this.messageEndRef.current) {
            this.messageEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    };

    handleInputChange = (e) => {
        this.setState({ input: e.target.value });
    };

    handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            this.handleSubmit();
        }
    };

    handleReinitialize = async () => {
        const { datasetId } = this.props;
        
        if (!window.confirm('This will reinitialize embeddings with the latest data. Continue?')) {
            return;
        }

        this.setState({ reinitializing: true, error: null });

        try {
            // Delete existing embeddings
            await ragService.deleteEmbeddings(datasetId);
            
            // Reinitialize with latest data
            await ragService.initialize(datasetId);
            
            this.setState({ 
                reinitializing: false,
                embeddingsReady: true,
                messages: []
            });
            
            alert('Embeddings reinitialized successfully!');
        } catch (error) {
            console.error('Error reinitializing:', error);
            this.setState({
                error: 'Failed to reinitialize embeddings: ' + error.toString(),
                reinitializing: false,
                embeddingsReady: false
            });
        }
    };

    handleSubmit = async () => {
        const { input, messages } = this.state;
        const { datasetId } = this.props;

        if (!input.trim()) return;

        // Add user message
        const userMessage = {
            role: 'user',
            content: input.trim(),
            timestamp: new Date().toISOString()
        };

        this.setState({
            messages: [...messages, userMessage],
            input: '',
            loading: true,
            error: null
        });

        try {
            // Call RAG query API
            const response = await ragService.query(datasetId, input.trim());

            // Add assistant response with thinking
            const assistantMessage = {
                role: 'assistant',
                content: response.answer,
                thinking: response.thinking,
                timestamp: new Date().toISOString()
            };

            this.setState(prevState => ({
                messages: [...prevState.messages, assistantMessage],
                loading: false
            }));
        } catch (error) {
            console.error('Error querying RAG:', error);
            this.setState({
                error: error.toString(),
                loading: false
            });
        }
    };

    renderMessage = (message, index) => {
        const isUser = message.role === 'user';
        
        return (
            <div key={index} className={`chat-message ${isUser ? 'user-message' : 'assistant-message'}`}>
                <div className="message-header">
                    <span className="message-role">
                        {isUser ? (
                            <>
                                <i className="fas fa-user-circle"></i> You
                            </>
                        ) : (
                            <>
                                <i className="fas fa-sparkles"></i> AI Assistant
                            </>
                        )}
                    </span>
                </div>
                <div className="message-content">
                    {message.content}
                </div>
                {!isUser && message.thinking && message.thinking.length > 0 && (
                    <details className="thinking-section">
                        <summary className="thinking-toggle">
                            <i className="fas fa-brain"></i> View thinking process
                        </summary>
                        <div className="thinking-content">
                            {message.thinking.map((think, idx) => (
                                <div key={idx} className="thinking-item">
                                    {think}
                                </div>
                            ))}
                        </div>
                    </details>
                )}
            </div>
        );
    };

    render() {
        const { show, onHide, datasetName } = this.props;
        const { messages, input, loading, error, reinitializing, initializing, embeddingsReady, checkingStatus } = this.state;

        if (!show) return null;

        const isReady = embeddingsReady && !initializing && !checkingStatus;
        const statusMessage = checkingStatus ? 'Checking embeddings status...' : 
                             initializing ? 'Initializing embeddings for the first time...' :
                             !embeddingsReady ? 'Embeddings not ready. Click "Refresh Data" to initialize.' : null;

        return (
            <div className="chat-modal-overlay" onClick={onHide}>
                <div className="chat-modal-content" onClick={(e) => e.stopPropagation()}>
                    <div className="chat-modal-header">
                        <h4>
                            <i className="fas fa-magic" style={{ marginRight: '10px', color: '#4285f4' }}></i>
                            Chat with {datasetName}
                        </h4>
                        <div>
                            <button 
                                className="btn btn-sm btn-outline-secondary" 
                                onClick={this.handleReinitialize}
                                disabled={reinitializing || loading}
                                style={{ marginRight: '10px' }}
                                title="Reinitialize embeddings with latest data"
                            >
                                <i className={reinitializing ? 'fas fa-sync fa-spin' : 'fas fa-sync'}></i>
                                {reinitializing ? ' Reinitializing...' : ' Refresh Data'}
                            </button>
                            <button className="chat-modal-close" onClick={onHide}>&times;</button>
                        </div>
                    </div>
                    <div className="chat-modal-body">
                        {statusMessage && (
                            <div className={`alert ${initializing || checkingStatus ? 'alert-info' : 'alert-warning'}`} role="alert">
                                {(initializing || checkingStatus) && <i className="fas fa-spinner fa-spin"></i>} {statusMessage}
                            </div>
                        )}
                        <div className="messages-container">
                            {messages.length === 0 ? (
                                <div className="empty-chat">
                                    <i className="fas fa-comments" style={{ fontSize: '3em', color: '#ccc', marginBottom: '10px' }}></i>
                                    <p>Ask me anything about this dataset!</p>
                                    <div className="example-questions">
                                        <small className="text-muted">Example questions:</small>
                                        <ul>
                                            <li>What are the key columns in this dataset?</li>
                                            <li>What is the data about?</li>
                                            <li>How many rows are in this dataset?</li>
                                        </ul>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {messages.map((msg, idx) => this.renderMessage(msg, idx))}
                                    {loading && (
                                        <div className="chat-message assistant-message loading-message">
                                            <div className="message-header">
                                                <span className="message-role">
                                                    <i className="fas fa-magic"></i> AI Assistant
                                                </span>
                                        </div>
                                        <div className="message-content">
                                            <span className="typing-indicator">
                                                <span></span>
                                                <span></span>
                                                <span></span>
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                        <div ref={this.messageEndRef} />
                    </div>
                    {error && (
                        <div className="alert alert-danger" role="alert">
                            <i className="fas fa-exclamation-triangle"></i> {error}
                        </div>
                    )}
                    </div>
                    <div className="chat-modal-footer">
                        <textarea
                            rows={2}
                            placeholder={isReady ? "Ask a question about this dataset..." : "Initializing embeddings..."}
                            value={input}
                            onChange={this.handleInputChange}
                            onKeyPress={this.handleKeyPress}
                            disabled={loading || !isReady}
                            className="chat-input form-control"
                        />
                        <button 
                            className="btn btn-primary send-button" 
                            onClick={this.handleSubmit}
                            disabled={loading || !input.trim() || !isReady}
                        >
                            <i className="fas fa-paper-plane"></i> Send
                        </button>
                    </div>
                </div>
            </div>
        );
    }
}

export default DatasetChat;
