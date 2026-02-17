/**
 * useMessages Hook
 * 
 * Central hook for managing chat messages state, including
 * fetching, sending, pagination, and error handling.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Message } from '../types';
import { fetchMessages, sendMessage as sendMessageApi } from '../api/messages';

const DEFAULT_LIMIT = 30;

export interface UseMessagesReturn {
    messages: Message[];
    isLoading: boolean;
    isLoadingMore: boolean;
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
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [hasMore, setHasMore] = useState(false);

    // Ref to track loading state for concurrent load prevention
    const isLoadingMoreRef = useRef(false);

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
     * Sends a new message to the API.
     * On success, adds the new message to the list maintaining chronological order.
     * On failure, sets error state (input preservation is handled by the component).
     * 
     * @param message - The message text to send
     * @param author - The author name
     */
    const sendMessage = useCallback(async (message: string, author: string): Promise<void> => {
        setIsSending(true);
        setError(null);

        try {
            const newMessage = await sendMessageApi({ message, author });

            // Add the new message to the list, maintaining chronological order
            // New messages go at the end (newest at bottom)
            setMessages((prevMessages) => [...prevMessages, newMessage]);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to send message'));
            throw err; // Re-throw so the component knows the send failed
        } finally {
            setIsSending(false);
        }
    }, []);

    /**
     * Loads more (older) messages using the oldest timestamp for pagination.
     * Older messages are prepended to the beginning of the list.
     */
    const loadMore = useCallback(async (): Promise<void> => {
        // Don't load more if already loading or no more messages
        if (isLoadingMoreRef.current || !hasMore || messages.length === 0) {
            return;
        }

        isLoadingMoreRef.current = true;
        setIsLoadingMore(true);
        setError(null);

        try {
            // Get the oldest timestamp from current messages
            const oldestTimestamp = messages[0]?.timestamp;

            // Fetch older messages using the after parameter
            const olderMessages = await fetchMessages({
                after: oldestTimestamp,
                limit,
            });

            if (olderMessages.length > 0) {
                // Sort older messages chronologically (oldest first)
                const sortedOlderMessages = [...olderMessages].sort(
                    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
                );

                // Prepend older messages to the beginning of the list
                setMessages((prevMessages) => [...sortedOlderMessages, ...prevMessages]);
            }

            // Update hasMore based on whether we received the full limit
            setHasMore(olderMessages.length >= limit);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to load more messages'));
        } finally {
            isLoadingMoreRef.current = false;
            setIsLoadingMore(false);
        }
    }, [hasMore, messages, limit]);

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
        isLoadingMore,
        isSending,
        error,
        sendMessage,
        loadMore,
        retry,
        hasMore,
    };
}
