/**
 * useMessages Hook
 * 
 * Central hook for managing chat messages state, including
 * fetching, sending, pagination, and error handling.
 */

import { useState, useEffect, useCallback } from 'react';
import type { Message } from '../types';
import { fetchMessages } from '../api/messages';

const DEFAULT_LIMIT = 30;

export interface UseMessagesReturn {
    messages: Message[];
    isLoading: boolean;
    isSending: boolean;
    error: Error | null;
    sendMessage: (message: string, author: string) => Promise<void>;
    loadMore: () => Promise<void>;
    retry: () => Promise<void>;
    hasMore: boolean;
}

/**
 * Hook for managing chat messages.
 * 
 * @param limit - Maximum number of messages to fetch initially (default: 30)
 * @returns Object containing messages state and actions
 */
export function useMessages(limit: number = DEFAULT_LIMIT): UseMessagesReturn {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [hasMore, setHasMore] = useState(false);

    /**
     * Fetches messages from the API and updates state.
     * Messages are sorted chronologically (oldest first).
     */
    const loadMessages = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const fetchedMessages = await fetchMessages({ limit });

            // API returns messages in reverse chronological order (newest first)
            // We need to reverse them for display (oldest first, newest at bottom)
            const sortedMessages = [...fetchedMessages].sort(
                (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
            );

            setMessages(sortedMessages);
            // If we received the full limit, there might be more messages
            setHasMore(fetchedMessages.length >= limit);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to fetch messages'));
        } finally {
            setIsLoading(false);
        }
    }, [limit]);

    // Fetch messages on mount
    useEffect(() => {
        loadMessages();
    }, [loadMessages]);

    /**
     * Sends a new message.
     * Note: Full implementation in task 7.2
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const sendMessage = useCallback(async (message: string, author: string): Promise<void> => {
        setIsSending(true);
        try {
            // TODO: Implement in task 7.2
            throw new Error('sendMessage not yet implemented');
        } finally {
            setIsSending(false);
        }
    }, []);

    /**
     * Loads more (older) messages.
     * Note: Full implementation in task 7.5
     */
    const loadMore = useCallback(async (): Promise<void> => {
        // TODO: Implement in task 7.5
    }, []);

    /**
     * Retries fetching messages after an error.
     * Note: Full implementation in task 7.8
     */
    const retry = useCallback(async (): Promise<void> => {
        await loadMessages();
    }, [loadMessages]);

    return {
        messages,
        isLoading,
        isSending,
        error,
        sendMessage,
        loadMore,
        retry,
        hasMore,
    };
}
