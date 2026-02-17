import { useState, useEffect } from 'react';
import styles from './MessageInput.module.css';
import Tooltip from './Tooltip';

interface MessageInputProps {
    onSend: (message: string, author: string) => Promise<void>;
    disabled?: boolean;
    defaultAuthor?: string;
}

const AUTHOR_STORAGE_KEY = 'chat_author_name';

function MessageInput({ onSend, disabled = false, defaultAuthor = '' }: MessageInputProps) {
    const [message, setMessage] = useState('');
    const [author, setAuthor] = useState(() => {
        // Try to get saved author from localStorage
        const saved = localStorage.getItem(AUTHOR_STORAGE_KEY);
        return saved || defaultAuthor;
    });
    const [authorSaved, setAuthorSaved] = useState(() => {
        // Check if author was previously saved
        return !!localStorage.getItem(AUTHOR_STORAGE_KEY);
    });
    const [isEditing, setIsEditing] = useState(false);
    const [previousAuthor, setPreviousAuthor] = useState('');

    // Sync with localStorage when author changes
    useEffect(() => {
        if (authorSaved && author.trim()) {
            localStorage.setItem(AUTHOR_STORAGE_KEY, author.trim());
        }
    }, [author, authorSaved]);

    // Validation: both message and author must have non-whitespace content
    const trimmedMessage = message.trim();
    const trimmedAuthor = author.trim();
    const isValid = trimmedMessage.length > 0 && trimmedAuthor.length > 0;

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!isValid) return;

        // Save author name after first successful send
        if (!authorSaved || isEditing) {
            localStorage.setItem(AUTHOR_STORAGE_KEY, trimmedAuthor);
            setAuthorSaved(true);
            setIsEditing(false);
        }

        // Trim whitespace before sending
        await onSend(trimmedMessage, trimmedAuthor);
        // Clear message after send
        setMessage('');
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        // Enter without Shift submits the message (when valid)
        // Shift+Enter allows default behavior (newline insertion)
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (isValid && !disabled) {
                // Save author name after first successful send
                if (!authorSaved || isEditing) {
                    localStorage.setItem(AUTHOR_STORAGE_KEY, trimmedAuthor);
                    setAuthorSaved(true);
                    setIsEditing(false);
                }
                onSend(trimmedMessage, trimmedAuthor);
                setMessage('');
            }
        }
    };

    const handleEditName = () => {
        setPreviousAuthor(author);
        setIsEditing(true);
        setAuthorSaved(false);
    };

    const handleCancelEdit = () => {
        setAuthor(previousAuthor);
        setIsEditing(false);
        setAuthorSaved(true);
    };

    const handleSaveName = () => {
        if (trimmedAuthor.length > 0) {
            localStorage.setItem(AUTHOR_STORAGE_KEY, trimmedAuthor);
            setAuthorSaved(true);
            setIsEditing(false);
        }
    };

    return (
        <form className={styles.form} onSubmit={handleSubmit}>
            {/* Author name section - shown only if not saved yet */}
            {!authorSaved ? (
                <div className={styles.authorSection}>
                    <input
                        id="author-input"
                        type="text"
                        className={styles.authorInput}
                        value={author}
                        onChange={(e) => setAuthor(e.target.value)}
                        placeholder="Your name"
                        disabled={disabled}
                        aria-label="Your name"
                    />
                    {isEditing && (
                        <>
                            <button
                                type="button"
                                className={`${styles.iconButton} ${styles.saveIcon}`}
                                onClick={handleSaveName}
                                disabled={trimmedAuthor.length === 0}
                                aria-label="Save name"
                            >
                                ✓
                            </button>
                            <button
                                type="button"
                                className={`${styles.iconButton} ${styles.cancelIcon}`}
                                onClick={handleCancelEdit}
                                aria-label="Cancel editing name"
                            >
                                ✕
                            </button>
                        </>
                    )}
                </div>
            ) : (
                <div className={styles.authorBadge}>
                    <span className={styles.authorName}>{trimmedAuthor}</span>
                    <Tooltip content="Change your display name" position="top">
                        <button
                            type="button"
                            className={styles.editButton}
                            onClick={handleEditName}
                            aria-label="Change name"
                        >
                            ✎
                        </button>
                    </Tooltip>
                </div>
            )}

            {/* Message input row */}
            <div className={styles.inputRow}>
                <textarea
                    id="message-input"
                    className={styles.textarea}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message..."
                    disabled={disabled}
                    rows={1}
                    aria-label="Message"
                />
                <button
                    type="submit"
                    className={styles.sendButton}
                    disabled={disabled || !isValid}
                    aria-label="Send message"
                >
                    <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M22 2L11 13" />
                        <path d="M22 2L15 22L11 13L2 9L22 2Z" />
                    </svg>
                </button>
            </div>
        </form>
    );
}

export default MessageInput;
