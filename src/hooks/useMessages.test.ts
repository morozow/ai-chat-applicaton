/**
 * Unit tests for useMessages hook
 * 
 * Tests the hook's behavior for fetching messages on mount,
 * tracking loading/error states, and message ordering.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
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
vi.mock('../api/messages', () => ({
    fetchMessages: (...args: unknown[]) => mockFetchMessages(...args),
}));

// Import after mocks are set up
import { useMessages } from './useMessages';

describe('useMessages', () => {
    beforeEach(() => {
        vi.clearAllMocks();
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
    });
});
