import { useState } from 'react';
import styles from './MessageInput.module.css';

interface MessageInputProps {
    onSend: (message: string, author: string) => Promise<void>;
    disabled?: boolean;
    defaultAuthor?: string;
}

function MessageInput({ onSend, disabled = false, defaultAuthor = '' }: MessageInputProps) {
    const [message, setMessage] = useState('');
    const [author, setAuthor] = useState(defaultAuthor);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSend(message, author);
    };

    return (
        <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.inputGroup}>
                <label htmlFor="message-input" className={styles.label}>
                    Message
                </label>
                <textarea
                    id="message-input"
                    className={styles.textarea}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type your message..."
                    disabled={disabled}
                    rows={3}
                />
            </div>

            <div className={styles.inputGroup}>
                <label htmlFor="author-input" className={styles.label}>
                    Your name
                </label>
                <input
                    id="author-input"
                    type="text"
                    className={styles.input}
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    placeholder="Enter your name"
                    disabled={disabled}
                />
            </div>

            <button
                type="submit"
                className={styles.sendButton}
                disabled={disabled}
                aria-label="Send message"
            >
                Send
            </button>
        </form>
    );
}

export default MessageInput;
