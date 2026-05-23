import React, { useEffect, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { FiMessageCircle, FiX, FiSend } from 'react-icons/fi';

const DocumentChatWidget = ({ uploadId, visible }) => {
    const { getAccessTokenSilently, isAuthenticated } = useAuth0();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [questionInput, setQuestionInput] = useState('');
    const [isAsking, setIsAsking] = useState(false);
    const [chatError, setChatError] = useState('');

    useEffect(() => {
        setMessages([]);
        setQuestionInput('');
        setChatError('');
        setIsAsking(false);
    }, [uploadId]);

    useEffect(() => {
        if (!visible) {
            setIsOpen(false);
        }
    }, [visible]);

    async function handleAskQuestion(event) {
        event.preventDefault();
        if (!isAuthenticated || !uploadId || !questionInput.trim()) return;

        const question = questionInput.trim();
        setQuestionInput('');
        setChatError('');
        setMessages((prev) => [...prev, { role: 'user', text: question }]);
        setIsAsking(true);

        try {
            const token = await getAccessTokenSilently({
                audience: 'https://synopspy-backend.com/api',
            });
            const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
            const response = await fetch(`${BACKEND_URL}/uploads/${uploadId}/chat`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ question }),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.detail || 'Failed to ask question');
            }

            setMessages((prev) => [
                ...prev,
                {
                    role: 'assistant',
                    text: data.answer || 'No answer returned.',
                },
            ]);
        } catch (error) {
            setChatError(error.message);
        } finally {
            setIsAsking(false);
        }
    }

    const canChat = isAuthenticated && uploadId;

    if (!visible) {
        return null;
    }

    return (
        <div className="chat-widget-root" aria-live="polite">
            {isOpen && (
                <div
                    className="chat-widget-panel"
                    role="dialog"
                    aria-label="Document chat"
                >
                    <header className="chat-widget-header">
                        <div>
                            <h3 className="chat-widget-title">Ask about this document</h3>
                            <p className="chat-widget-subtitle">Answers use only your uploaded file</p>
                        </div>
                        <button
                            type="button"
                            className="chat-widget-close"
                            onClick={() => setIsOpen(false)}
                            aria-label="Close chat"
                        >
                            <FiX />
                        </button>
                    </header>

                    <div className="chat-widget-messages">
                        {!isAuthenticated ? (
                            <p className="chat-widget-hint">Sign in to chat with your document.</p>
                        ) : !uploadId ? (
                            <p className="chat-widget-hint">Chat is available for saved uploads.</p>
                        ) : messages.length === 0 ? (
                            <p className="chat-widget-hint">
                                Ask a specific question about this document and get a grounded answer.
                            </p>
                        ) : (
                            messages.map((message, index) => (
                                <div
                                    key={index}
                                    className={`chat-widget-message chat-widget-message--${message.role}`}
                                >
                                    <p>{message.text}</p>
                                </div>
                            ))
                        )}
                        {isAsking && (
                            <div className="chat-widget-message chat-widget-message--assistant chat-widget-typing">
                                <p>Thinking…</p>
                            </div>
                        )}
                    </div>

                    {chatError && <p className="chat-widget-error">{chatError}</p>}

                    <form className="chat-widget-input-row" onSubmit={handleAskQuestion}>
                        <input
                            type="text"
                            value={questionInput}
                            onChange={(e) => setQuestionInput(e.target.value)}
                            placeholder="Ask a question…"
                            disabled={!canChat || isAsking}
                        />
                        <button
                            type="submit"
                            disabled={!canChat || isAsking || !questionInput.trim()}
                            aria-label="Send message"
                        >
                            <FiSend />
                        </button>
                    </form>
                </div>
            )}

            <button
                type="button"
                className={`chat-widget-fab ${isOpen ? 'chat-widget-fab--open' : ''}`}
                onClick={() => setIsOpen((open) => !open)}
                aria-label={isOpen ? 'Close document chat' : 'Open document chat'}
                aria-expanded={isOpen}
            >
                {isOpen ? <FiX /> : <FiMessageCircle />}
            </button>
        </div>
    );
};

export default DocumentChatWidget;
