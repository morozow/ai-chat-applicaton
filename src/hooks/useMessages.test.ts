/**
 * Unit tests for useMessages hook
 * 
 * Tests the hook's behavior for fetching messages on mount,
 * tracking loading/error states, and message ordering.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import type { Message } from '../types';

// Mock the config module to avoid environment variable errors
vi.mock('../config', () => ({
    config: {
        apiUrl: 'http://localhost:3000',
        apiToken: 'test-token',
    },
}));

// Mock the messages API
const mockFetchMessages = vi.fn();
const mockSendMessage = vi.fn();
vi.mock('../api/messages', () => ({
    fetchMessages: (...args: unknown[]) => mockFetchMessages(...args),
    sendMessage: (...args: unknown[]) => mockSendMessage(...args),
}));

// Import after mocks are set up
import { useMessages } from './useMessages';

describe('useMessages', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockSendMessage.mockReset();
    });

    afterEach(() => {
        vi.resetAllMocks();
    });

    describe('initial state', () => {
        it('starts with isLoading true', () => {
            mockFetchMessages.mockImplementation(() => new Promise(() => { })); // Never resolves

            const { result } = renderHook(() => useMessages());

            expect(result.current.isLoading).toBe(true);
        });

        it('starts with empty messages array', () => {
            mockFetchMessages.mockImplementation(() => new Promise(() => { }));

            const { result } = renderHook(() => useMessages());

            expect(result.current.messages).toEqual([]);
        });

        it('starts with no error', () => {
            mockFetchMessages.mockImplementation(() => new Promise(() => { }));

            const { result } = renderHook(() => useMessages());

            expect(result.current.error).toBeNull();
        });

        it('starts with isSending false', () => {
            mockFetchMessages.mockImplementation(() => new Promise(() => { }));

            const { result } = renderHook(() => useMessages());

            expect(result.current.isSending).toBe(false);
        });

        it('starts with hasMore false', () => {
            mockFetchMessages.mockImplementation(() => new Promise(() => { }));

            const { result } = renderHook(() => useMessages());

            expect(result.current.hasMore).toBe(false);
        });
    });

    describe('fetching messages on mount', () => {
        it('fetches messages when mounted', async () => {
            mockFetchMessages.mockResolvedValue([]);

            renderHook(() => useMessages());

            await waitFor(() => {
                expect(mockFetchMessages).toHaveBeenCalledTimes(1);
            });
        });

        it('fetches messages with default limit of 30', async () => {
            mockFetchMessages.mockResolvedValue([]);

            renderHook(() => useMessages());

            await waitFor(() => {
                expect(mockFetchMessages).toHaveBeenCalledWith({ limit: 30 });
            });
        });

        it('fetches messages with custom limit', async () => {
            mockFetchMessages.mockResolvedValue([]);

            renderHook(() => useMessages(50));

            await waitFor(() => {
                expect(mockFetchMessages).toHaveBeenCalledWith({ limit: 50 });
            });
        });

        it('sets isLoading to false after successful fetch', async () => {
            mockFetchMessages.mockResolvedValue([]);

            const { result } = renderHook(() => useMessages());

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });
        });

        it('sets messages after successful fetch', async () => {
            const mockMessages: Message[] = [
                { id: '1', message: 'Hello', author: 'Alice', timestamp: '2024-01-01T10:00:00Z' },
                { id: '2', message: 'Hi', author: 'Bob', timestamp: '2024-01-01T10:01:00Z' },
            ];
            mockFetchMessages.mockResolvedValue(mockMessages);

            const { result } = renderHook(() => useMessages());

            await waitFor(() => {
                expect(result.current.messages).toHaveLength(2);
            });
        });
    });

    describe('message ordering', () => {
        it('sorts messages chronologically (oldest first)', async () => {
            // API returns newest first
            const mockMessages: Message[] = [
                { id: '3', message: 'Third', author: 'Charlie', timestamp: '2024-01-01T12:00:00Z' },
                { id: '2', message: 'Second', author: 'Bob', timestamp: '2024-01-01T11:00:00Z' },
                { id: '1', message: 'First', author: 'Alice', timestamp: '2024-01-01T10:00:00Z' },
            ];
            mockFetchMessages.mockResolvedValue(mockMessages);

            const { result } = renderHook(() => useMessages());

            await waitFor(() => {
                expect(result.current.messages[0].id).toBe('1');
                expect(result.current.messages[1].id).toBe('2');
                expect(result.current.messages[2].id).toBe('3');
            });
        });

        it('handles already sorted messages', async () => {
            const mockMessages: Message[] = [
                { id: '1', message: 'First', author: 'Alice', timestamp: '2024-01-01T10:00:00Z' },
                { id: '2', message: 'Second', author: 'Bob', timestamp: '2024-01-01T11:00:00Z' },
            ];
            mockFetchMessages.mockResolvedValue(mockMessages);

            const { result } = renderHook(() => useMessages());

            await waitFor(() => {
                expect(result.current.messages[0].id).toBe('1');
                expect(result.current.messages[1].id).toBe('2');
            });
        });

        it('handles messages with same timestamp', async () => {
            const mockMessages: Message[] = [
                { id: '1', message: 'First', author: 'Alice', timestamp: '2024-01-01T10:00:00Z' },
                { id: '2', message: 'Second', author: 'Bob', timestamp: '2024-01-01T10:00:00Z' },
            ];
            mockFetchMessages.mockResolvedValue(mockMessages);

            const { result } = renderHook(() => useMessages());

            await waitFor(() => {
                expect(result.current.messages).toHaveLength(2);
            });
        });
    });

    describe('error handling', () => {
        it('sets error when fetch fails', async () => {
            const error = new Error('Network error');
            mockFetchMessages.mockRejectedValue(error);

            const { result } = renderHook(() => useMessages());

            await waitFor(() => {
                expect(result.current.error).toEqual(error);
            });
        });

        it('sets isLoading to false when fetch fails', async () => {
            mockFetchMessages.mockRejectedValue(new Error('Network error'));

            const { result } = renderHook(() => useMessages());

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });
        });

        it('keeps messages empty when fetch fails', async () => {
            mockFetchMessages.mockRejectedValue(new Error('Network error'));

            const { result } = renderHook(() => useMessages());

            await waitFor(() => {
                expect(result.current.messages).toEqual([]);
            });
        });

        it('wraps non-Error objects in Error', async () => {
            mockFetchMessages.mockRejectedValue('string error');

            const { result } = renderHook(() => useMessages());

            await waitFor(() => {
                expect(result.current.error).toBeInstanceOf(Error);
                expect(result.current.error?.message).toBe('Failed to fetch messages');
            });
        });
    });

    describe('hasMore state', () => {
        it('sets hasMore to true when received messages equal limit', async () => {
            const mockMessages: Message[] = Array.from({ length: 30 }, (_, i) => ({
                id: String(i),
                message: `Message ${i}`,
                author: 'User',
                timestamp: new Date(2024, 0, 1, 10, i).toISOString(),
            }));
            mockFetchMessages.mockResolvedValue(mockMessages);

            const { result } = renderHook(() => useMessages(30));

            await waitFor(() => {
                expect(result.current.hasMore).toBe(true);
            });
        });

        it('sets hasMore to false when received messages less than limit', async () => {
            const mockMessages: Message[] = [
                { id: '1', message: 'Hello', author: 'Alice', timestamp: '2024-01-01T10:00:00Z' },
            ];
            mockFetchMessages.mockResolvedValue(mockMessages);

            const { result } = renderHook(() => useMessages(30));

            await waitFor(() => {
                expect(result.current.hasMore).toBe(false);
            });
        });

        it('sets hasMore to false when no messages returned', async () => {
            mockFetchMessages.mockResolvedValue([]);

            const { result } = renderHook(() => useMessages());

            await waitFor(() => {
                expect(result.current.hasMore).toBe(false);
            });
        });
    });

    describe('retry functionality', () => {
        it('retry function re-fetches messages', async () => {
            mockFetchMessages.mockRejectedValueOnce(new Error('Network error'));

            const { result } = renderHook(() => useMessages());

            // Wait for initial failed fetch
            await waitFor(() => {
                expect(result.current.error).not.toBeNull();
            });

            // Setup successful response for retry
            const mockMessages: Message[] = [
                { id: '1', message: 'Hello', author: 'Alice', timestamp: '2024-01-01T10:00:00Z' },
            ];
            mockFetchMessages.mockResolvedValue(mockMessages);

            // Call retry
            await result.current.retry();

            await waitFor(() => {
                expect(result.current.messages).toHaveLength(1);
                expect(result.current.error).toBeNull();
            });
        });

        it('retry clears previous error', async () => {
            mockFetchMessages.mockRejectedValueOnce(new Error('Network error'));

            const { result } = renderHook(() => useMessages());

            await waitFor(() => {
                expect(result.current.error).not.toBeNull();
            });

            mockFetchMessages.mockResolvedValue([]);

            await result.current.retry();

            await waitFor(() => {
                expect(result.current.error).toBeNull();
            });
        });

        it('retry sets isLoading to true while fetching', async () => {
            mockFetchMessages.mockRejectedValueOnce(new Error('Network error'));

            const { result } = renderHook(() => useMessages());

            // Wait for initial failed fetch
            await waitFor(() => {
                expect(result.current.error).not.toBeNull();
                expect(result.current.isLoading).toBe(false);
            });

            // Setup a delayed response for retry
            let resolveRetry: (value: Message[]) => void;
            mockFetchMessages.mockImplementation(() => new Promise((resolve) => {
                resolveRetry = resolve;
            }));

            // Start retry (don't await)
            const retryPromise = result.current.retry();

            // Should be loading
            await waitFor(() => {
                expect(result.current.isLoading).toBe(true);
            });

            // Resolve the retry
            resolveRetry!([]);
            await retryPromise;

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });
        });

        it('retry can fail again and set error state', async () => {
            mockFetchMessages.mockRejectedValueOnce(new Error('First error'));

            const { result } = renderHook(() => useMessages());

            // Wait for initial failed fetch
            await waitFor(() => {
                expect(result.current.error?.message).toBe('First error');
            });

            // Setup another failure for retry
            mockFetchMessages.mockRejectedValueOnce(new Error('Second error'));

            await result.current.retry();

            await waitFor(() => {
                expect(result.current.error?.message).toBe('Second error');
            });
        });

        it('retry can be called multiple times until success', async () => {
            mockFetchMessages
                .mockRejectedValueOnce(new Error('First error'))
                .mockRejectedValueOnce(new Error('Second error'));

            const { result } = renderHook(() => useMessages());

            // Wait for initial failed fetch
            await waitFor(() => {
                expect(result.current.error).not.toBeNull();
            });

            // First retry fails
            await result.current.retry();

            await waitFor(() => {
                expect(result.current.error?.message).toBe('Second error');
            });

            // Setup success for second retry
            const mockMessages: Message[] = [
                { id: '1', message: 'Hello', author: 'Alice', timestamp: '2024-01-01T10:00:00Z' },
            ];
            mockFetchMessages.mockResolvedValue(mockMessages);

            // Second retry succeeds
            await result.current.retry();

            await waitFor(() => {
                expect(result.current.error).toBeNull();
                expect(result.current.messages).toHaveLength(1);
            });
        });
    });

    describe('sendMessage functionality', () => {
        it('calls API with message and author', async () => {
            mockFetchMessages.mockResolvedValue([]);
            const newMessage: Message = {
                id: '1',
                message: 'Hello',
                author: 'Alice',
                timestamp: '2024-01-01T10:00:00Z',
            };
            mockSendMessage.mockResolvedValue(newMessage);

            const { result } = renderHook(() => useMessages());

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            await result.current.sendMessage('Hello', 'Alice');

            expect(mockSendMessage).toHaveBeenCalledWith({
                message: 'Hello',
                author: 'Alice',
            });
        });

        it('sets isSending to true while sending', async () => {
            mockFetchMessages.mockResolvedValue([]);
            let resolveSend: (value: Message) => void;
            mockSendMessage.mockImplementation(() => new Promise((resolve) => {
                resolveSend = resolve;
            }));

            const { result } = renderHook(() => useMessages());

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            // Start sending (don't await)
            const sendPromise = result.current.sendMessage('Hello', 'Alice');

            await waitFor(() => {
                expect(result.current.isSending).toBe(true);
            });

            // Resolve the send
            resolveSend!({
                id: '1',
                message: 'Hello',
                author: 'Alice',
                timestamp: '2024-01-01T10:00:00Z',
            });

            await sendPromise;

            await waitFor(() => {
                expect(result.current.isSending).toBe(false);
            });
        });

        it('adds new message to the list on success', async () => {
            const existingMessages: Message[] = [
                { id: '1', message: 'First', author: 'Bob', timestamp: '2024-01-01T10:00:00Z' },
            ];
            mockFetchMessages.mockResolvedValue(existingMessages);

            const newMessage: Message = {
                id: '2',
                message: 'Hello',
                author: 'Alice',
                timestamp: '2024-01-01T10:01:00Z',
            };
            mockSendMessage.mockResolvedValue(newMessage);

            const { result } = renderHook(() => useMessages());

            await waitFor(() => {
                expect(result.current.messages).toHaveLength(1);
            });

            await result.current.sendMessage('Hello', 'Alice');

            await waitFor(() => {
                expect(result.current.messages).toHaveLength(2);
                expect(result.current.messages[1]).toEqual(newMessage);
            });
        });

        it('appends new message at the end (newest at bottom)', async () => {
            const existingMessages: Message[] = [
                { id: '1', message: 'First', author: 'Bob', timestamp: '2024-01-01T10:00:00Z' },
                { id: '2', message: 'Second', author: 'Charlie', timestamp: '2024-01-01T10:01:00Z' },
            ];
            mockFetchMessages.mockResolvedValue(existingMessages);

            const newMessage: Message = {
                id: '3',
                message: 'Third',
                author: 'Alice',
                timestamp: '2024-01-01T10:02:00Z',
            };
            mockSendMessage.mockResolvedValue(newMessage);

            const { result } = renderHook(() => useMessages());

            await waitFor(() => {
                expect(result.current.messages).toHaveLength(2);
            });

            await result.current.sendMessage('Third', 'Alice');

            await waitFor(() => {
                expect(result.current.messages).toHaveLength(3);
                expect(result.current.messages[2].id).toBe('3');
            });
        });

        it('sets error state on failure', async () => {
            mockFetchMessages.mockResolvedValue([]);
            const error = new Error('Network error');
            mockSendMessage.mockRejectedValue(error);

            const { result } = renderHook(() => useMessages());

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            await expect(result.current.sendMessage('Hello', 'Alice')).rejects.toThrow('Network error');

            await waitFor(() => {
                expect(result.current.error).toEqual(error);
            });
        });

        it('sets isSending to false on failure', async () => {
            mockFetchMessages.mockResolvedValue([]);
            mockSendMessage.mockRejectedValue(new Error('Network error'));

            const { result } = renderHook(() => useMessages());

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            try {
                await result.current.sendMessage('Hello', 'Alice');
            } catch {
                // Expected to throw
            }

            await waitFor(() => {
                expect(result.current.isSending).toBe(false);
            });
        });

        it('does not modify messages on failure', async () => {
            const existingMessages: Message[] = [
                { id: '1', message: 'First', author: 'Bob', timestamp: '2024-01-01T10:00:00Z' },
            ];
            mockFetchMessages.mockResolvedValue(existingMessages);
            mockSendMessage.mockRejectedValue(new Error('Network error'));

            const { result } = renderHook(() => useMessages());

            await waitFor(() => {
                expect(result.current.messages).toHaveLength(1);
            });

            try {
                await result.current.sendMessage('Hello', 'Alice');
            } catch {
                // Expected to throw
            }

            await waitFor(() => {
                expect(result.current.messages).toHaveLength(1);
                expect(result.current.messages[0].id).toBe('1');
            });
        });

        it('wraps non-Error objects in Error on failure', async () => {
            mockFetchMessages.mockResolvedValue([]);
            mockSendMessage.mockRejectedValue('string error');

            const { result } = renderHook(() => useMessages());

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            try {
                await result.current.sendMessage('Hello', 'Alice');
            } catch {
                // Expected to throw
            }

            await waitFor(() => {
                expect(result.current.error).toBeInstanceOf(Error);
                expect(result.current.error?.message).toBe('Failed to send message');
            });
        });

        it('clears previous error before sending', async () => {
            mockFetchMessages.mockResolvedValue([]);
            mockSendMessage.mockRejectedValueOnce(new Error('First error'));

            const { result } = renderHook(() => useMessages());

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            // First send fails
            try {
                await result.current.sendMessage('Hello', 'Alice');
            } catch {
                // Expected
            }

            await waitFor(() => {
                expect(result.current.error).not.toBeNull();
            });

            // Second send succeeds
            const newMessage: Message = {
                id: '1',
                message: 'Hello',
                author: 'Alice',
                timestamp: '2024-01-01T10:00:00Z',
            };
            mockSendMessage.mockResolvedValue(newMessage);

            await result.current.sendMessage('Hello', 'Alice');

            await waitFor(() => {
                expect(result.current.error).toBeNull();
            });
        });

        it('re-throws error so component can handle it', async () => {
            mockFetchMessages.mockResolvedValue([]);
            mockSendMessage.mockRejectedValue(new Error('Send failed'));

            const { result } = renderHook(() => useMessages());

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            await expect(result.current.sendMessage('Hello', 'Alice')).rejects.toThrow('Send failed');
        });
    });

    describe('return value structure', () => {
        it('returns all expected properties', async () => {
            mockFetchMessages.mockResolvedValue([]);

            const { result } = renderHook(() => useMessages());

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(result.current).toHaveProperty('messages');
            expect(result.current).toHaveProperty('isLoading');
            expect(result.current).toHaveProperty('isSending');
            expect(result.current).toHaveProperty('error');
            expect(result.current).toHaveProperty('sendMessage');
            expect(result.current).toHaveProperty('loadMore');
            expect(result.current).toHaveProperty('retry');
            expect(result.current).toHaveProperty('hasMore');
        });

        it('sendMessage is a function', async () => {
            mockFetchMessages.mockResolvedValue([]);

            const { result } = renderHook(() => useMessages());

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(typeof result.current.sendMessage).toBe('function');
        });

        it('loadMore is a function', async () => {
            mockFetchMessages.mockResolvedValue([]);

            const { result } = renderHook(() => useMessages());

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(typeof result.current.loadMore).toBe('function');
        });

        it('retry is a function', async () => {
            mockFetchMessages.mockResolvedValue([]);

            const { result } = renderHook(() => useMessages());

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(typeof result.current.retry).toBe('function');
        });

        it('isLoadingMore is a boolean', async () => {
            mockFetchMessages.mockResolvedValue([]);

            const { result } = renderHook(() => useMessages());

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(result.current).toHaveProperty('isLoadingMore');
            expect(typeof result.current.isLoadingMore).toBe('boolean');
        });
    });

    describe('initial state for isLoadingMore', () => {
        it('starts with isLoadingMore false', () => {
            mockFetchMessages.mockImplementation(() => new Promise(() => { }));

            const { result } = renderHook(() => useMessages());

            expect(result.current.isLoadingMore).toBe(false);
        });
    });

    describe('loadMore functionality', () => {
        describe('basic behavior', () => {
            it('does not load more when messages array is empty', async () => {
                mockFetchMessages.mockResolvedValue([]);

                const { result } = renderHook(() => useMessages());

                await waitFor(() => {
                    expect(result.current.isLoading).toBe(false);
                });

                // Reset mock to track loadMore calls
                mockFetchMessages.mockClear();

                await act(async () => {
                    await result.current.loadMore();
                });

                // Should not have called fetchMessages again
                expect(mockFetchMessages).not.toHaveBeenCalled();
            });

            it('does not load more when hasMore is false', async () => {
                // Return fewer messages than limit to set hasMore to false
                const mockMessages: Message[] = [
                    { id: '1', message: 'Hello', author: 'Alice', timestamp: '2024-01-01T10:00:00Z' },
                ];
                mockFetchMessages.mockResolvedValue(mockMessages);

                const { result } = renderHook(() => useMessages(30));

                await waitFor(() => {
                    expect(result.current.isLoading).toBe(false);
                    expect(result.current.hasMore).toBe(false);
                });

                mockFetchMessages.mockClear();

                await act(async () => {
                    await result.current.loadMore();
                });

                expect(mockFetchMessages).not.toHaveBeenCalled();
            });

            it('calls fetchMessages with after parameter set to oldest timestamp', async () => {
                // Initial messages - return full limit to set hasMore to true
                const initialMessages: Message[] = Array.from({ length: 30 }, (_, i) => ({
                    id: String(i + 1),
                    message: `Message ${i + 1}`,
                    author: 'User',
                    timestamp: new Date(2024, 0, 1, 10, i).toISOString(),
                }));

                let callCount = 0;
                mockFetchMessages.mockImplementation(() => {
                    callCount++;
                    if (callCount === 1) {
                        return Promise.resolve(initialMessages);
                    }
                    return Promise.resolve([]);
                });

                const { result } = renderHook(() => useMessages(30));

                await waitFor(() => {
                    expect(result.current.isLoading).toBe(false);
                    expect(result.current.hasMore).toBe(true);
                });

                await act(async () => {
                    await result.current.loadMore();
                });

                // Should have called with the oldest timestamp
                const oldestTimestamp = result.current.messages[0].timestamp;
                expect(mockFetchMessages).toHaveBeenLastCalledWith({
                    after: oldestTimestamp,
                    limit: 30,
                });
            });
        });

        describe('prepending older messages', () => {
            it('prepends older messages to the beginning of the list', async () => {
                // Initial messages (newer)
                const initialMessages: Message[] = Array.from({ length: 30 }, (_, i) => ({
                    id: String(i + 100),
                    message: `New Message ${i}`,
                    author: 'User',
                    timestamp: new Date(2024, 0, 2, 10, i).toISOString(), // Jan 2
                }));

                // Older messages to prepend
                const olderMessages: Message[] = [
                    { id: '1', message: 'Old 1', author: 'Alice', timestamp: '2024-01-01T08:00:00Z' },
                    { id: '2', message: 'Old 2', author: 'Bob', timestamp: '2024-01-01T09:00:00Z' },
                ];

                let callCount = 0;
                mockFetchMessages.mockImplementation(() => {
                    callCount++;
                    if (callCount === 1) {
                        return Promise.resolve(initialMessages);
                    }
                    return Promise.resolve(olderMessages);
                });

                const { result } = renderHook(() => useMessages(30));

                await waitFor(() => {
                    expect(result.current.isLoading).toBe(false);
                    expect(result.current.hasMore).toBe(true);
                });

                const initialFirstMessageId = result.current.messages[0].id;

                await act(async () => {
                    await result.current.loadMore();
                });

                // Older messages should be at the beginning
                expect(result.current.messages[0].id).toBe('1');
                expect(result.current.messages[1].id).toBe('2');
                // Original first message should now be after the older messages
                expect(result.current.messages[2].id).toBe(initialFirstMessageId);
            });

            it('sorts older messages chronologically before prepending', async () => {
                const initialMessages: Message[] = Array.from({ length: 30 }, (_, i) => ({
                    id: String(i + 100),
                    message: `Message ${i}`,
                    author: 'User',
                    timestamp: new Date(2024, 0, 2, 10, i).toISOString(),
                }));

                // Return older messages in reverse order (API returns newest first)
                const olderMessages: Message[] = [
                    { id: '3', message: 'Third', author: 'Charlie', timestamp: '2024-01-01T12:00:00Z' },
                    { id: '2', message: 'Second', author: 'Bob', timestamp: '2024-01-01T11:00:00Z' },
                    { id: '1', message: 'First', author: 'Alice', timestamp: '2024-01-01T10:00:00Z' },
                ];

                let callCount = 0;
                mockFetchMessages.mockImplementation(() => {
                    callCount++;
                    if (callCount === 1) {
                        return Promise.resolve(initialMessages);
                    }
                    return Promise.resolve(olderMessages);
                });

                const { result } = renderHook(() => useMessages(30));

                await waitFor(() => {
                    expect(result.current.isLoading).toBe(false);
                });

                await act(async () => {
                    await result.current.loadMore();
                });

                // Should be sorted chronologically (oldest first)
                expect(result.current.messages[0].id).toBe('1');
                expect(result.current.messages[1].id).toBe('2');
                expect(result.current.messages[2].id).toBe('3');
            });

            it('maintains chronological order after prepending', async () => {
                // Return full limit to enable hasMore
                const fullInitialMessages = Array.from({ length: 30 }, (_, i) => ({
                    id: String(i + 10),
                    message: `Message ${i}`,
                    author: 'User',
                    timestamp: new Date(2024, 0, 2, 10, i).toISOString(),
                }));

                const olderMessages: Message[] = [
                    { id: '1', message: 'Old 1', author: 'Alice', timestamp: '2024-01-01T08:00:00Z' },
                    { id: '2', message: 'Old 2', author: 'Bob', timestamp: '2024-01-01T09:00:00Z' },
                ];

                let callCount = 0;
                mockFetchMessages.mockImplementation(() => {
                    callCount++;
                    if (callCount === 1) {
                        return Promise.resolve(fullInitialMessages);
                    }
                    return Promise.resolve(olderMessages);
                });

                const { result } = renderHook(() => useMessages(30));

                await waitFor(() => {
                    expect(result.current.isLoading).toBe(false);
                });

                await act(async () => {
                    await result.current.loadMore();
                });

                // Verify all messages are in chronological order
                for (let i = 1; i < result.current.messages.length; i++) {
                    const prevTime = new Date(result.current.messages[i - 1].timestamp).getTime();
                    const currTime = new Date(result.current.messages[i].timestamp).getTime();
                    expect(currTime).toBeGreaterThanOrEqual(prevTime);
                }
            });
        });

        describe('hasMore state updates', () => {
            it('sets hasMore to true when loadMore returns full limit', async () => {
                const initialMessages: Message[] = Array.from({ length: 30 }, (_, i) => ({
                    id: String(i + 100),
                    message: `Message ${i}`,
                    author: 'User',
                    timestamp: new Date(2024, 0, 2, 10, i).toISOString(),
                }));

                // Return full limit of older messages
                const olderMessages: Message[] = Array.from({ length: 30 }, (_, i) => ({
                    id: String(i + 1),
                    message: `Old ${i}`,
                    author: 'User',
                    timestamp: new Date(2024, 0, 1, 10, i).toISOString(),
                }));

                let callCount = 0;
                mockFetchMessages.mockImplementation(() => {
                    callCount++;
                    if (callCount === 1) {
                        return Promise.resolve(initialMessages);
                    }
                    return Promise.resolve(olderMessages);
                });

                const { result } = renderHook(() => useMessages(30));

                await waitFor(() => {
                    expect(result.current.isLoading).toBe(false);
                });

                await act(async () => {
                    await result.current.loadMore();
                });

                expect(result.current.hasMore).toBe(true);
            });

            it('sets hasMore to false when loadMore returns fewer than limit', async () => {
                const initialMessages: Message[] = Array.from({ length: 30 }, (_, i) => ({
                    id: String(i + 100),
                    message: `Message ${i}`,
                    author: 'User',
                    timestamp: new Date(2024, 0, 2, 10, i).toISOString(),
                }));

                // Return fewer than limit
                const olderMessages: Message[] = [
                    { id: '1', message: 'Old 1', author: 'Alice', timestamp: '2024-01-01T08:00:00Z' },
                ];

                let callCount = 0;
                mockFetchMessages.mockImplementation(() => {
                    callCount++;
                    if (callCount === 1) {
                        return Promise.resolve(initialMessages);
                    }
                    return Promise.resolve(olderMessages);
                });

                const { result } = renderHook(() => useMessages(30));

                await waitFor(() => {
                    expect(result.current.isLoading).toBe(false);
                });

                await act(async () => {
                    await result.current.loadMore();
                });

                expect(result.current.hasMore).toBe(false);
            });

            it('sets hasMore to false when loadMore returns empty array', async () => {
                const initialMessages: Message[] = Array.from({ length: 30 }, (_, i) => ({
                    id: String(i + 100),
                    message: `Message ${i}`,
                    author: 'User',
                    timestamp: new Date(2024, 0, 2, 10, i).toISOString(),
                }));

                let callCount = 0;
                mockFetchMessages.mockImplementation(() => {
                    callCount++;
                    if (callCount === 1) {
                        return Promise.resolve(initialMessages);
                    }
                    return Promise.resolve([]);
                });

                const { result } = renderHook(() => useMessages(30));

                await waitFor(() => {
                    expect(result.current.isLoading).toBe(false);
                });

                await act(async () => {
                    await result.current.loadMore();
                });

                expect(result.current.hasMore).toBe(false);
            });
        });

        describe('error handling', () => {
            it('sets error when loadMore fails', async () => {
                const initialMessages: Message[] = Array.from({ length: 30 }, (_, i) => ({
                    id: String(i + 100),
                    message: `Message ${i}`,
                    author: 'User',
                    timestamp: new Date(2024, 0, 2, 10, i).toISOString(),
                }));

                const error = new Error('Network error');

                let callCount = 0;
                mockFetchMessages.mockImplementation(() => {
                    callCount++;
                    if (callCount === 1) {
                        return Promise.resolve(initialMessages);
                    }
                    return Promise.reject(error);
                });

                const { result } = renderHook(() => useMessages(30));

                await waitFor(() => {
                    expect(result.current.isLoading).toBe(false);
                });

                await act(async () => {
                    await result.current.loadMore();
                });

                expect(result.current.error).toEqual(error);
            });

            it('sets isLoadingMore to false when loadMore fails', async () => {
                const initialMessages: Message[] = Array.from({ length: 30 }, (_, i) => ({
                    id: String(i + 100),
                    message: `Message ${i}`,
                    author: 'User',
                    timestamp: new Date(2024, 0, 2, 10, i).toISOString(),
                }));

                let callCount = 0;
                mockFetchMessages.mockImplementation(() => {
                    callCount++;
                    if (callCount === 1) {
                        return Promise.resolve(initialMessages);
                    }
                    return Promise.reject(new Error('Network error'));
                });

                const { result } = renderHook(() => useMessages(30));

                await waitFor(() => {
                    expect(result.current.isLoading).toBe(false);
                });

                await act(async () => {
                    await result.current.loadMore();
                });

                expect(result.current.isLoadingMore).toBe(false);
            });

            it('preserves existing messages when loadMore fails', async () => {
                const initialMessages: Message[] = Array.from({ length: 30 }, (_, i) => ({
                    id: String(i + 100),
                    message: `Message ${i}`,
                    author: 'User',
                    timestamp: new Date(2024, 0, 2, 10, i).toISOString(),
                }));

                let callCount = 0;
                mockFetchMessages.mockImplementation(() => {
                    callCount++;
                    if (callCount === 1) {
                        return Promise.resolve(initialMessages);
                    }
                    return Promise.reject(new Error('Network error'));
                });

                const { result } = renderHook(() => useMessages(30));

                await waitFor(() => {
                    expect(result.current.isLoading).toBe(false);
                });

                const messageCountBefore = result.current.messages.length;

                await act(async () => {
                    await result.current.loadMore();
                });

                expect(result.current.messages.length).toBe(messageCountBefore);
            });

            it('wraps non-Error objects in Error', async () => {
                const initialMessages: Message[] = Array.from({ length: 30 }, (_, i) => ({
                    id: String(i + 100),
                    message: `Message ${i}`,
                    author: 'User',
                    timestamp: new Date(2024, 0, 2, 10, i).toISOString(),
                }));

                let callCount = 0;
                mockFetchMessages.mockImplementation(() => {
                    callCount++;
                    if (callCount === 1) {
                        return Promise.resolve(initialMessages);
                    }
                    return Promise.reject('string error');
                });

                const { result } = renderHook(() => useMessages(30));

                await waitFor(() => {
                    expect(result.current.isLoading).toBe(false);
                });

                await act(async () => {
                    await result.current.loadMore();
                });

                expect(result.current.error).toBeInstanceOf(Error);
                expect(result.current.error?.message).toBe('Failed to load more messages');
            });
        });

        describe('concurrent load prevention', () => {
            it('does not start another loadMore while one is in progress', async () => {
                const initialMessages: Message[] = Array.from({ length: 30 }, (_, i) => ({
                    id: String(i + 100),
                    message: `Message ${i}`,
                    author: 'User',
                    timestamp: new Date(2024, 0, 2, 10, i).toISOString(),
                }));

                let callCount = 0;
                let resolveLoadMore: (value: Message[]) => void;
                mockFetchMessages.mockImplementation(() => {
                    callCount++;
                    if (callCount === 1) {
                        return Promise.resolve(initialMessages);
                    }
                    return new Promise((resolve) => {
                        resolveLoadMore = resolve;
                    });
                });

                const { result } = renderHook(() => useMessages(30));

                await waitFor(() => {
                    expect(result.current.isLoading).toBe(false);
                });

                // Start first loadMore
                const firstLoadMore = act(async () => {
                    await result.current.loadMore();
                });

                // Wait a tick for the loadMore to start
                await new Promise(resolve => setTimeout(resolve, 10));

                // Record call count before second attempt
                const callCountBeforeSecond = callCount;

                // Try to start second loadMore while first is in progress
                await act(async () => {
                    await result.current.loadMore();
                });

                // Should not have made another API call
                expect(callCount).toBe(callCountBeforeSecond);

                // Resolve first loadMore
                resolveLoadMore!([]);
                await firstLoadMore;
            });
        });
    });
});

/**
 * Property-Based Tests for useMessages hook
 *
 * Feature: chat-application, Property 5: Successful Send Updates Message List
 * **Validates: Requirements 4.6**
 */
import * as fc from 'fast-check';

// Helper to generate valid ISO timestamp strings using integer timestamps
const isoTimestampArb = fc.integer({ min: 1577836800000, max: 1893456000000 }) // 2020-01-01 to 2030-01-01
    .map(ts => new Date(ts).toISOString());

describe('Property-Based Tests: useMessages', () => {
    /**
     * Feature: chat-application, Property 5: Successful Send Updates Message List
     */
    describe('Property 5: Successful Send Updates Message List', () => {
        /**
         * **Validates: Requirements 4.6**
         *
         * Property: For any message successfully sent to the Chat_API,
         * the returned message SHALL appear in the Message_List after
         * the send operation completes.
         */
        it('should add any successfully sent message to the message list', async () => {
            await fc.assert(
                fc.asyncProperty(
                    // Generate arbitrary message text (non-empty, printable for simplicity)
                    fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
                    // Generate arbitrary author name (non-empty)
                    fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
                    // Generate arbitrary message ID
                    fc.uuid(),
                    // Generate arbitrary timestamp as ISO string
                    isoTimestampArb,
                    async (messageText, authorName, messageId, timestamp) => {
                        // Reset mocks for each iteration
                        mockFetchMessages.mockReset();
                        mockSendMessage.mockReset();

                        // Setup: Start with empty message list
                        mockFetchMessages.mockResolvedValue([]);

                        // The message that will be returned by the API after successful send
                        const returnedMessage: Message = {
                            id: messageId,
                            message: messageText,
                            author: authorName,
                            timestamp: timestamp,
                        };
                        mockSendMessage.mockResolvedValue(returnedMessage);

                        // Render the hook
                        const { result } = renderHook(() => useMessages());

                        // Wait for initial load to complete
                        await waitFor(() => {
                            expect(result.current.isLoading).toBe(false);
                        });

                        // Act: Send the message
                        await act(async () => {
                            await result.current.sendMessage(messageText, authorName);
                        });

                        // Assert: The returned message appears in the message list
                        const messageInList = result.current.messages.find(
                            (msg) => msg.id === returnedMessage.id
                        );
                        expect(messageInList).toBeDefined();
                        expect(messageInList?.message).toBe(returnedMessage.message);
                        expect(messageInList?.author).toBe(returnedMessage.author);
                        expect(messageInList?.timestamp).toBe(returnedMessage.timestamp);
                    }
                ),
                { numRuns: 20 }
            );
        }, 60000); // 60 second timeout for property test

        it('should add sent message to existing messages list', async () => {
            await fc.assert(
                fc.asyncProperty(
                    // Generate arbitrary existing messages (0-5 messages for speed)
                    fc.array(
                        fc.record({
                            id: fc.uuid(),
                            message: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
                            author: fc.string({ minLength: 1, maxLength: 30 }).filter(s => s.trim().length > 0),
                            timestamp: isoTimestampArb,
                        }),
                        { minLength: 0, maxLength: 5 }
                    ),
                    // Generate new message to send
                    fc.record({
                        id: fc.uuid(),
                        message: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
                        author: fc.string({ minLength: 1, maxLength: 30 }).filter(s => s.trim().length > 0),
                        timestamp: isoTimestampArb,
                    }),
                    async (existingMessages, newMessage) => {
                        // Reset mocks for each iteration
                        mockFetchMessages.mockReset();
                        mockSendMessage.mockReset();

                        // Setup: Start with existing messages
                        mockFetchMessages.mockResolvedValue(existingMessages);

                        // The message that will be returned by the API
                        const returnedMessage: Message = {
                            id: newMessage.id,
                            message: newMessage.message,
                            author: newMessage.author,
                            timestamp: newMessage.timestamp,
                        };
                        mockSendMessage.mockResolvedValue(returnedMessage);

                        // Render the hook
                        const { result } = renderHook(() => useMessages());

                        // Wait for initial load to complete
                        await waitFor(() => {
                            expect(result.current.isLoading).toBe(false);
                        });

                        const initialMessageCount = result.current.messages.length;

                        // Act: Send the message
                        await act(async () => {
                            await result.current.sendMessage(newMessage.message, newMessage.author);
                        });

                        // Assert: Message count increased by 1
                        expect(result.current.messages.length).toBe(initialMessageCount + 1);

                        // The new message is in the list
                        const messageInList = result.current.messages.find(
                            (msg) => msg.id === returnedMessage.id
                        );
                        expect(messageInList).toBeDefined();
                        expect(messageInList?.id).toBe(returnedMessage.id);
                        expect(messageInList?.message).toBe(returnedMessage.message);
                        expect(messageInList?.author).toBe(returnedMessage.author);
                    }
                ),
                { numRuns: 20 }
            );
        }, 60000); // 60 second timeout for property test

        it('should place sent message at the end of the list (newest at bottom)', async () => {
            await fc.assert(
                fc.asyncProperty(
                    // Generate existing messages with older timestamps (2020-2024)
                    fc.array(
                        fc.record({
                            id: fc.uuid(),
                            message: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
                            author: fc.string({ minLength: 1, maxLength: 30 }).filter(s => s.trim().length > 0),
                            timestamp: fc.integer({ min: 1577836800000, max: 1735689600000 })
                                .map(ts => new Date(ts).toISOString()),
                        }),
                        { minLength: 1, maxLength: 3 }
                    ),
                    // Generate new message with newer timestamp (2025+)
                    fc.record({
                        id: fc.uuid(),
                        message: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
                        author: fc.string({ minLength: 1, maxLength: 30 }).filter(s => s.trim().length > 0),
                        timestamp: fc.integer({ min: 1735689600001, max: 1893456000000 })
                            .map(ts => new Date(ts).toISOString()),
                    }),
                    async (existingMessages, newMessage) => {
                        // Reset mocks for each iteration
                        mockFetchMessages.mockReset();
                        mockSendMessage.mockReset();

                        // Setup: Start with existing messages
                        mockFetchMessages.mockResolvedValue(existingMessages);

                        const returnedMessage: Message = {
                            id: newMessage.id,
                            message: newMessage.message,
                            author: newMessage.author,
                            timestamp: newMessage.timestamp,
                        };
                        mockSendMessage.mockResolvedValue(returnedMessage);

                        // Render the hook
                        const { result } = renderHook(() => useMessages());

                        // Wait for initial load to complete
                        await waitFor(() => {
                            expect(result.current.isLoading).toBe(false);
                        });

                        // Act: Send the message
                        await act(async () => {
                            await result.current.sendMessage(newMessage.message, newMessage.author);
                        });

                        // Assert: The new message is at the end of the list
                        const lastMessage = result.current.messages[result.current.messages.length - 1];
                        expect(lastMessage.id).toBe(returnedMessage.id);
                    }
                ),
                { numRuns: 20 }
            );
        }, 60000); // 60 second timeout for property test
    });
});

/**
 * Property-Based Tests for useMessages hook
 *
 * Feature: chat-application, Property 6: Successful Send Clears Input
 * **Validates: Requirements 4.8**
 */
describe('Property 6: Successful Send Clears Input', () => {
    /**
     * **Validates: Requirements 4.8**
     *
     * Property: For any successful message send operation, the sendMessage function
     * SHALL complete without throwing, which signals to the component that it can
     * clear the input field.
     *
     * Note: The actual input clearing is handled by the MessageInput component.
     * The hook's responsibility is to complete successfully (not throw) on success,
     * which allows the component to clear the input.
     */
    it('should complete without throwing for any successful send operation', async () => {
        await fc.assert(
            fc.asyncProperty(
                // Generate arbitrary message text (non-empty, trimmed)
                fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
                // Generate arbitrary author name (non-empty, trimmed)
                fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
                // Generate arbitrary message ID
                fc.uuid(),
                // Generate arbitrary timestamp as ISO string
                isoTimestampArb,
                async (messageText, authorName, messageId, timestamp) => {
                    // Reset mocks for each iteration
                    mockFetchMessages.mockReset();
                    mockSendMessage.mockReset();

                    // Setup: Start with empty message list
                    mockFetchMessages.mockResolvedValue([]);

                    // The message that will be returned by the API after successful send
                    const returnedMessage: Message = {
                        id: messageId,
                        message: messageText,
                        author: authorName,
                        timestamp: timestamp,
                    };
                    mockSendMessage.mockResolvedValue(returnedMessage);

                    // Render the hook
                    const { result } = renderHook(() => useMessages());

                    // Wait for initial load to complete
                    await waitFor(() => {
                        expect(result.current.isLoading).toBe(false);
                    });

                    // Act & Assert: sendMessage should complete without throwing
                    // This is the signal to the component that it can clear the input
                    let didThrow = false;
                    try {
                        await act(async () => {
                            await result.current.sendMessage(messageText, authorName);
                        });
                    } catch {
                        didThrow = true;
                    }

                    expect(didThrow).toBe(false);
                }
            ),
            { numRuns: 20 }
        );
    }, 60000); // 60 second timeout for property test

    it('should not be in sending state after successful send completes', async () => {
        await fc.assert(
            fc.asyncProperty(
                // Generate arbitrary message text (non-empty)
                fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
                // Generate arbitrary author name (non-empty)
                fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
                // Generate arbitrary message ID
                fc.uuid(),
                // Generate arbitrary timestamp
                isoTimestampArb,
                async (messageText, authorName, messageId, timestamp) => {
                    // Reset mocks for each iteration
                    mockFetchMessages.mockReset();
                    mockSendMessage.mockReset();

                    // Setup
                    mockFetchMessages.mockResolvedValue([]);
                    const returnedMessage: Message = {
                        id: messageId,
                        message: messageText,
                        author: authorName,
                        timestamp: timestamp,
                    };
                    mockSendMessage.mockResolvedValue(returnedMessage);

                    // Render the hook
                    const { result } = renderHook(() => useMessages());

                    // Wait for initial load
                    await waitFor(() => {
                        expect(result.current.isLoading).toBe(false);
                    });

                    // Act: Send the message
                    await act(async () => {
                        await result.current.sendMessage(messageText, authorName);
                    });

                    // Assert: isSending should be false after completion
                    // This indicates the send operation is complete and component can proceed
                    expect(result.current.isSending).toBe(false);
                }
            ),
            { numRuns: 20 }
        );
    }, 60000); // 60 second timeout for property test

    it('should have no error state after successful send', async () => {
        await fc.assert(
            fc.asyncProperty(
                // Generate arbitrary message text (non-empty)
                fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
                // Generate arbitrary author name (non-empty)
                fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
                // Generate arbitrary message ID
                fc.uuid(),
                // Generate arbitrary timestamp
                isoTimestampArb,
                async (messageText, authorName, messageId, timestamp) => {
                    // Reset mocks for each iteration
                    mockFetchMessages.mockReset();
                    mockSendMessage.mockReset();

                    // Setup
                    mockFetchMessages.mockResolvedValue([]);
                    const returnedMessage: Message = {
                        id: messageId,
                        message: messageText,
                        author: authorName,
                        timestamp: timestamp,
                    };
                    mockSendMessage.mockResolvedValue(returnedMessage);

                    // Render the hook
                    const { result } = renderHook(() => useMessages());

                    // Wait for initial load
                    await waitFor(() => {
                        expect(result.current.isLoading).toBe(false);
                    });

                    // Act: Send the message
                    await act(async () => {
                        await result.current.sendMessage(messageText, authorName);
                    });

                    // Assert: No error after successful send
                    // This confirms the operation was successful and component can clear input
                    expect(result.current.error).toBeNull();
                }
            ),
            { numRuns: 20 }
        );
    }, 60000); // 60 second timeout for property test
});


/**
 * Property-Based Tests for useMessages hook
 *
 * Feature: chat-application, Property 9: Pagination Uses After Parameter
 * **Validates: Requirements 6.2**
 */
describe('Property 9: Pagination Uses After Parameter', () => {
    /**
     * **Validates: Requirements 6.2**
     *
     * Property: For any load more action when older messages exist,
     * the API request SHALL include the `after` query parameter set to
     * the timestamp of the oldest currently displayed message.
     */
    it('should call fetchMessages with after parameter set to oldest message timestamp', async () => {
        await fc.assert(
            fc.asyncProperty(
                // Generate initial messages (must be >= limit to enable hasMore)
                // Use a fixed limit of 30 for testing
                fc.array(
                    fc.record({
                        id: fc.uuid(),
                        message: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
                        author: fc.string({ minLength: 1, maxLength: 30 }).filter(s => s.trim().length > 0),
                        timestamp: isoTimestampArb,
                    }),
                    { minLength: 30, maxLength: 30 } // Exactly 30 to trigger hasMore=true
                ),
                async (initialMessages) => {
                    // Reset mocks for each iteration
                    mockFetchMessages.mockReset();
                    mockSendMessage.mockReset();

                    let fetchCallCount = 0;
                    let loadMoreCallParams: { after?: string; limit?: number } | undefined;

                    mockFetchMessages.mockImplementation((params?: { after?: string; limit?: number }) => {
                        fetchCallCount++;
                        if (fetchCallCount === 1) {
                            // Initial fetch
                            return Promise.resolve(initialMessages);
                        }
                        // loadMore fetch - capture the params
                        loadMoreCallParams = params;
                        return Promise.resolve([]);
                    });

                    // Render the hook with limit 30
                    const { result } = renderHook(() => useMessages(30));

                    // Wait for initial load to complete
                    await waitFor(() => {
                        expect(result.current.isLoading).toBe(false);
                    });

                    // Verify hasMore is true (we have exactly 30 messages)
                    expect(result.current.hasMore).toBe(true);
                    expect(result.current.messages.length).toBeGreaterThan(0);

                    // Get the oldest message timestamp (first message after sorting)
                    const oldestTimestamp = result.current.messages[0].timestamp;

                    // Act: Call loadMore
                    await act(async () => {
                        await result.current.loadMore();
                    });

                    // Assert: fetchMessages was called with after parameter
                    expect(loadMoreCallParams).toBeDefined();
                    expect(loadMoreCallParams?.after).toBe(oldestTimestamp);
                    expect(loadMoreCallParams?.limit).toBe(30);
                }
            ),
            { numRuns: 20 }
        );
    }, 60000); // 60 second timeout for property test

    it('should use the chronologically oldest message timestamp regardless of original order', async () => {
        await fc.assert(
            fc.asyncProperty(
                // Generate messages with varying timestamps
                fc.array(
                    fc.record({
                        id: fc.uuid(),
                        message: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
                        author: fc.string({ minLength: 1, maxLength: 30 }).filter(s => s.trim().length > 0),
                        timestamp: isoTimestampArb,
                    }),
                    { minLength: 30, maxLength: 30 }
                ),
                async (initialMessages) => {
                    // Reset mocks for each iteration
                    mockFetchMessages.mockReset();
                    mockSendMessage.mockReset();

                    let fetchCallCount = 0;
                    let loadMoreCallParams: { after?: string; limit?: number } | undefined;

                    mockFetchMessages.mockImplementation((params?: { after?: string; limit?: number }) => {
                        fetchCallCount++;
                        if (fetchCallCount === 1) {
                            return Promise.resolve(initialMessages);
                        }
                        loadMoreCallParams = params;
                        return Promise.resolve([]);
                    });

                    const { result } = renderHook(() => useMessages(30));

                    await waitFor(() => {
                        expect(result.current.isLoading).toBe(false);
                    });

                    // The hook sorts messages chronologically, so messages[0] should be the oldest
                    // Calculate what the oldest timestamp should be
                    const sortedMessages = [...initialMessages].sort(
                        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
                    );
                    const expectedOldestTimestamp = sortedMessages[0].timestamp;

                    // Verify the hook sorted correctly
                    expect(result.current.messages[0].timestamp).toBe(expectedOldestTimestamp);

                    // Act: Call loadMore
                    await act(async () => {
                        await result.current.loadMore();
                    });

                    // Assert: The after parameter matches the oldest timestamp
                    expect(loadMoreCallParams?.after).toBe(expectedOldestTimestamp);
                }
            ),
            { numRuns: 20 }
        );
    }, 60000); // 60 second timeout for property test

    it('should include the configured limit in the loadMore request', async () => {
        await fc.assert(
            fc.asyncProperty(
                // Generate a random limit between 10 and 50
                fc.integer({ min: 10, max: 50 }),
                // Generate messages matching the limit
                fc.array(
                    fc.record({
                        id: fc.uuid(),
                        message: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
                        author: fc.string({ minLength: 1, maxLength: 30 }).filter(s => s.trim().length > 0),
                        timestamp: isoTimestampArb,
                    }),
                    { minLength: 50, maxLength: 50 } // Generate enough messages
                ),
                async (limit, allMessages) => {
                    // Take exactly 'limit' messages to trigger hasMore
                    const initialMessages = allMessages.slice(0, limit);

                    // Reset mocks for each iteration
                    mockFetchMessages.mockReset();
                    mockSendMessage.mockReset();

                    let fetchCallCount = 0;
                    let loadMoreCallParams: { after?: string; limit?: number } | undefined;

                    mockFetchMessages.mockImplementation((params?: { after?: string; limit?: number }) => {
                        fetchCallCount++;
                        if (fetchCallCount === 1) {
                            return Promise.resolve(initialMessages);
                        }
                        loadMoreCallParams = params;
                        return Promise.resolve([]);
                    });

                    const { result } = renderHook(() => useMessages(limit));

                    await waitFor(() => {
                        expect(result.current.isLoading).toBe(false);
                    });

                    // hasMore should be true since we returned exactly 'limit' messages
                    expect(result.current.hasMore).toBe(true);

                    // Act: Call loadMore
                    await act(async () => {
                        await result.current.loadMore();
                    });

                    // Assert: The limit parameter matches the configured limit
                    expect(loadMoreCallParams?.limit).toBe(limit);
                }
            ),
            { numRuns: 20 }
        );
    }, 60000); // 60 second timeout for property test
});



/**
 * Property-Based Tests for useMessages hook
 *
 * Feature: chat-application, Property 10: Older Messages Prepended
 * **Validates: Requirements 6.3**
 */
describe('Property 10: Older Messages Prepended', () => {
    /**
     * **Validates: Requirements 6.3**
     *
     * Property: For any pagination load that returns older messages,
     * those messages SHALL be prepended to the existing message list
     * (appearing before/above the previously oldest message).
     */
    it('should prepend older messages to the beginning of the list', async () => {
        await fc.assert(
            fc.asyncProperty(
                // Generate initial messages with newer timestamps (2024-2025)
                fc.array(
                    fc.record({
                        id: fc.uuid(),
                        message: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
                        author: fc.string({ minLength: 1, maxLength: 30 }).filter(s => s.trim().length > 0),
                        timestamp: fc.integer({ min: 1704067200000, max: 1735689600000 }) // 2024-01-01 to 2025-01-01
                            .map(ts => new Date(ts).toISOString()),
                    }),
                    { minLength: 30, maxLength: 30 } // Exactly 30 to trigger hasMore=true
                ),
                // Generate older messages with earlier timestamps (2022-2023)
                fc.array(
                    fc.record({
                        id: fc.uuid(),
                        message: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
                        author: fc.string({ minLength: 1, maxLength: 30 }).filter(s => s.trim().length > 0),
                        timestamp: fc.integer({ min: 1640995200000, max: 1672531199000 }) // 2022-01-01 to 2022-12-31
                            .map(ts => new Date(ts).toISOString()),
                    }),
                    { minLength: 1, maxLength: 10 }
                ),
                async (initialMessages, olderMessages) => {
                    // Reset mocks for each iteration
                    mockFetchMessages.mockReset();
                    mockSendMessage.mockReset();

                    let fetchCallCount = 0;

                    mockFetchMessages.mockImplementation(() => {
                        fetchCallCount++;
                        if (fetchCallCount === 1) {
                            return Promise.resolve(initialMessages);
                        }
                        return Promise.resolve(olderMessages);
                    });

                    // Render the hook with limit 30
                    const { result } = renderHook(() => useMessages(30));

                    // Wait for initial load to complete
                    await waitFor(() => {
                        expect(result.current.isLoading).toBe(false);
                    });

                    // Verify hasMore is true
                    expect(result.current.hasMore).toBe(true);

                    // Store the original first message ID (oldest of initial messages)
                    const originalFirstMessageId = result.current.messages[0].id;
                    const initialMessageCount = result.current.messages.length;

                    // Act: Call loadMore
                    await act(async () => {
                        await result.current.loadMore();
                    });

                    // Assert: Older messages are prepended
                    // The total count should increase by the number of older messages
                    expect(result.current.messages.length).toBe(initialMessageCount + olderMessages.length);

                    // The original first message should no longer be at index 0
                    // (older messages are now before it)
                    if (olderMessages.length > 0) {
                        expect(result.current.messages[0].id).not.toBe(originalFirstMessageId);

                        // All older message IDs should be in the list
                        const olderMessageIds = olderMessages.map(m => m.id);
                        const currentMessageIds = result.current.messages.map(m => m.id);
                        for (const olderId of olderMessageIds) {
                            expect(currentMessageIds).toContain(olderId);
                        }
                    }
                }
            ),
            { numRuns: 20 }
        );
    }, 60000); // 60 second timeout for property test

    it('should maintain chronological order after prepending older messages', async () => {
        await fc.assert(
            fc.asyncProperty(
                // Generate initial messages with newer timestamps
                fc.array(
                    fc.record({
                        id: fc.uuid(),
                        message: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
                        author: fc.string({ minLength: 1, maxLength: 30 }).filter(s => s.trim().length > 0),
                        timestamp: fc.integer({ min: 1704067200000, max: 1735689600000 }) // 2024
                            .map(ts => new Date(ts).toISOString()),
                    }),
                    { minLength: 30, maxLength: 30 }
                ),
                // Generate older messages with earlier timestamps
                fc.array(
                    fc.record({
                        id: fc.uuid(),
                        message: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
                        author: fc.string({ minLength: 1, maxLength: 30 }).filter(s => s.trim().length > 0),
                        timestamp: fc.integer({ min: 1640995200000, max: 1672531199000 }) // 2022
                            .map(ts => new Date(ts).toISOString()),
                    }),
                    { minLength: 1, maxLength: 10 }
                ),
                async (initialMessages, olderMessages) => {
                    // Reset mocks for each iteration
                    mockFetchMessages.mockReset();
                    mockSendMessage.mockReset();

                    let fetchCallCount = 0;

                    mockFetchMessages.mockImplementation(() => {
                        fetchCallCount++;
                        if (fetchCallCount === 1) {
                            return Promise.resolve(initialMessages);
                        }
                        return Promise.resolve(olderMessages);
                    });

                    const { result } = renderHook(() => useMessages(30));

                    await waitFor(() => {
                        expect(result.current.isLoading).toBe(false);
                    });

                    // Act: Call loadMore
                    await act(async () => {
                        await result.current.loadMore();
                    });

                    // Assert: All messages are in chronological order (oldest first)
                    const messages = result.current.messages;
                    for (let i = 1; i < messages.length; i++) {
                        const prevTime = new Date(messages[i - 1].timestamp).getTime();
                        const currTime = new Date(messages[i].timestamp).getTime();
                        expect(currTime).toBeGreaterThanOrEqual(prevTime);
                    }
                }
            ),
            { numRuns: 20 }
        );
    }, 60000); // 60 second timeout for property test

    it('should place older messages before the previously oldest message', async () => {
        await fc.assert(
            fc.asyncProperty(
                // Generate initial messages with newer timestamps
                fc.array(
                    fc.record({
                        id: fc.uuid(),
                        message: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
                        author: fc.string({ minLength: 1, maxLength: 30 }).filter(s => s.trim().length > 0),
                        timestamp: fc.integer({ min: 1704067200000, max: 1735689600000 }) // 2024
                            .map(ts => new Date(ts).toISOString()),
                    }),
                    { minLength: 30, maxLength: 30 }
                ),
                // Generate older messages with earlier timestamps
                fc.array(
                    fc.record({
                        id: fc.uuid(),
                        message: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
                        author: fc.string({ minLength: 1, maxLength: 30 }).filter(s => s.trim().length > 0),
                        timestamp: fc.integer({ min: 1640995200000, max: 1672531199000 }) // 2022
                            .map(ts => new Date(ts).toISOString()),
                    }),
                    { minLength: 1, maxLength: 10 }
                ),
                async (initialMessages, olderMessages) => {
                    // Reset mocks for each iteration
                    mockFetchMessages.mockReset();
                    mockSendMessage.mockReset();

                    let fetchCallCount = 0;

                    mockFetchMessages.mockImplementation(() => {
                        fetchCallCount++;
                        if (fetchCallCount === 1) {
                            return Promise.resolve(initialMessages);
                        }
                        return Promise.resolve(olderMessages);
                    });

                    const { result } = renderHook(() => useMessages(30));

                    await waitFor(() => {
                        expect(result.current.isLoading).toBe(false);
                    });

                    // Get the previously oldest message (first in sorted list)
                    const previouslyOldestMessage = result.current.messages[0];
                    const previouslyOldestTimestamp = new Date(previouslyOldestMessage.timestamp).getTime();

                    // Act: Call loadMore
                    await act(async () => {
                        await result.current.loadMore();
                    });

                    // Assert: All older messages appear before the previously oldest message
                    if (olderMessages.length > 0) {
                        // Find the index of the previously oldest message
                        const previouslyOldestIndex = result.current.messages.findIndex(
                            m => m.id === previouslyOldestMessage.id
                        );

                        // All messages before this index should be from the older messages batch
                        // and should have timestamps earlier than the previously oldest
                        for (let i = 0; i < previouslyOldestIndex; i++) {
                            const msgTimestamp = new Date(result.current.messages[i].timestamp).getTime();
                            expect(msgTimestamp).toBeLessThanOrEqual(previouslyOldestTimestamp);
                        }
                    }
                }
            ),
            { numRuns: 20 }
        );
    }, 60000); // 60 second timeout for property test
});
