import { useEffect, useRef } from 'react';
import type { Message } from '../types';
import MessageBubble from './MessageBubble';
import Loader from './Loader';
import styles from './MessageList.module.css';

interface MessageListProps {
    messages: Message[];
    isLoading: boolean;
    onLoadMore?: () => void;
    hasMore?: boolean;
    currentUser?: string;
}

function MessageList({
    messages,
    isLoading,
    onLoadMore,
    hasMore = false,
    currentUser,
}: MessageListProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const prevMessagesLengthRef = useRef(messages.length);

    // Auto-scroll to bottom when new messages are added at the end
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        // Only auto-scroll if messages were added (not on initial load or load more)
        const messagesAdded = messages.length > prevMessagesLengthRef.current;
        const wasAtBottom =
            container.scrollHeight - container.scrollTop - container.clientHeight < 100;

        if (messagesAdded && wasAtBottom) {
            container.scrollTop = container.scrollHeight;
        }

        prevMessagesLengthRef.current = messages.length;
    }, [messages]);

    // Scroll to bottom on initial load
    useEffect(() => {
        const container = containerRef.current;
        if (container && messages.length > 0 && !isLoading) {
            container.scrollTop = container.scrollHeight;
        }
    }, [isLoading, messages.length]);

    const showLoadMore = hasMore && onLoadMore && !isLoading;
    const showEmptyState = !isLoading && messages.length === 0;

    return (
        <div
            ref={containerRef}
            className={styles.container}
            role="log"
            aria-live="polite"
            aria-label="Chat messages"
        >
            {/* Load more button at top */}
            {showLoadMore && (
                <div className={styles.loadMoreContainer}>
                    <button
                        type="button"
                        className={styles.loadMoreButton}
                        onClick={onLoadMore}
                        aria-label="Load older messages"
                    >
                        Load more
                    </button>
                </div>
            )}

            {/* Loading indicator */}
            {isLoading && (
                <div className={styles.loaderContainer}>
                    <Loader size="medium" />
                </div>
            )}

            {/* Empty state */}
            {showEmptyState && (
                <div className={styles.emptyState}>
                    <p className={styles.emptyStateText}>
                        No messages yet. Start the conversation!
                    </p>
                </div>
            )}

            {/* Messages */}
            {messages.length > 0 && (
                <div className={styles.messages}>
                    {messages.map((message) => (
                        <MessageBubble
                            key={message.id}
                            message={message}
                            isCurrentUser={currentUser === message.author}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default MessageList;
