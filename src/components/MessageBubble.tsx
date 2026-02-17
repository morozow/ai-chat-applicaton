import type { Message } from '../types';
import styles from './MessageBubble.module.css';

interface MessageBubbleProps {
    message: Message;
    isCurrentUser?: boolean;
}

/**
 * Formats an ISO 8601 timestamp into a human-readable format
 * e.g., "Jan 1, 2024 10:30 AM"
 */
function formatTimestamp(timestamp: string): string {
    try {
        const date = new Date(timestamp);
        if (isNaN(date.getTime())) {
            return '';
        }
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
        });
    } catch {
        return '';
    }
}

function MessageBubble({ message, isCurrentUser = false }: MessageBubbleProps) {
    const formattedTime = formatTimestamp(message.createdAt);

    return (
        <article
            className={`${styles.bubble} ${isCurrentUser ? styles.own : styles.other}`}
            aria-label={`Message from ${message.author}`}
        >
            <span className={styles.author}>{message.author}</span>
            <p className={styles.text}>{message.message}</p>
            {formattedTime && (
                <time className={styles.timestamp} dateTime={message.createdAt}>
                    {formattedTime}
                </time>
            )}
        </article>
    );
}

export default MessageBubble;
