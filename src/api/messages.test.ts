/**
 * Unit tests for the Messages Service
 *
 * Tests the fetchMessages and sendMessage functions
 * with mocked fetch API.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock config before importing messages module
vi.mock('../config', () => ({
    config: {
        apiUrl: 'http://localhost:3000',
        apiToken: 'test-token',
    },
}));

// Import after mocking
import { fetchMessages, sendMessage } from './messages';
import type { Message, MessagesResponse } from '../types';

describe('Messages Service', () => {
    const mockFetch = vi.fn();

    beforeEach(() => {
        vi.stubGlobal('fetch', mockFetch);
        mockFetch.mockReset();
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    describe('fetchMessages', () => {
        const mockMessages: Message[] = [
            {
                id: '1',
                message: 'Hello',
                author: 'Alice',
                timestamp: '2024-01-01T10:00:00.000Z',
            },
            {
                id: '2',
                message: 'Hi there',
                author: 'Bob',
                timestamp: '2024-01-01T10:01:00.000Z',
            },
        ];

        it('should fetch messages without parameters', async () => {
            const response: MessagesResponse = { messages: mockMessages };
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(response),
            });

            const result = await fetchMessages();

            expect(mockFetch).toHaveBeenCalledTimes(1);
            const [url, options] = mockFetch.mock.calls[0];
            expect(url).toBe('http://localhost:3000/api/v1/messages');
            expect(options.method).toBe('GET');
            expect(options.headers.Authorization).toBe('Bearer test-token');
            expect(result).toEqual(mockMessages);
        });

        it('should fetch messages with after parameter', async () => {
            const response: MessagesResponse = { messages: mockMessages };
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(response),
            });

            const afterTimestamp = '2024-01-01T09:00:00.000Z';
            await fetchMessages({ after: afterTimestamp });

            const [url] = mockFetch.mock.calls[0];
            expect(url).toContain('after=2024-01-01T09%3A00%3A00.000Z');
        });

        it('should fetch messages with limit parameter', async () => {
            const response: MessagesResponse = { messages: mockMessages };
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(response),
            });

            await fetchMessages({ limit: 10 });

            const [url] = mockFetch.mock.calls[0];
            expect(url).toContain('limit=10');
        });

        it('should fetch messages with both after and limit parameters', async () => {
            const response: MessagesResponse = { messages: mockMessages };
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(response),
            });

            await fetchMessages({
                after: '2024-01-01T09:00:00.000Z',
                limit: 20,
            });

            const [url] = mockFetch.mock.calls[0];
            expect(url).toContain('after=');
            expect(url).toContain('limit=20');
        });

        it('should return empty array when no messages', async () => {
            const response: MessagesResponse = { messages: [] };
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(response),
            });

            const result = await fetchMessages();

            expect(result).toEqual([]);
        });

        it('should throw error on API failure', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 500,
                json: () =>
                    Promise.resolve({
                        error: 'server_error',
                        message: 'Internal server error',
                    }),
            });

            await expect(fetchMessages()).rejects.toThrow(
                'Internal server error'
            );
        });

        it('should throw error on 401 unauthorized', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 401,
                json: () =>
                    Promise.resolve({
                        error: 'unauthorized',
                        message: 'Invalid token',
                    }),
            });

            await expect(fetchMessages()).rejects.toThrow('Invalid token');
        });
    });

    describe('sendMessage', () => {
        const mockSentMessage: Message = {
            id: '3',
            message: 'New message',
            author: 'Charlie',
            timestamp: '2024-01-01T10:05:00.000Z',
        };

        it('should send a message with correct body', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockSentMessage),
            });

            const result = await sendMessage({
                message: 'New message',
                author: 'Charlie',
            });

            expect(mockFetch).toHaveBeenCalledTimes(1);
            const [url, options] = mockFetch.mock.calls[0];
            expect(url).toBe('http://localhost:3000/api/v1/messages');
            expect(options.method).toBe('POST');
            expect(options.headers.Authorization).toBe('Bearer test-token');
            expect(options.headers['Content-Type']).toBe('application/json');
            expect(JSON.parse(options.body)).toEqual({
                message: 'New message',
                author: 'Charlie',
            });
            expect(result).toEqual(mockSentMessage);
        });

        it('should return the created message', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockSentMessage),
            });

            const result = await sendMessage({
                message: 'Hello world',
                author: 'Test User',
            });

            expect(result.id).toBe('3');
            expect(result.message).toBe('New message');
            expect(result.author).toBe('Charlie');
            expect(result.timestamp).toBeDefined();
        });

        it('should throw error on API failure', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 400,
                json: () =>
                    Promise.resolve({
                        error: 'bad_request',
                        message: 'Message cannot be empty',
                    }),
            });

            await expect(
                sendMessage({ message: '', author: 'Test' })
            ).rejects.toThrow('Message cannot be empty');
        });

        it('should throw error on network failure', async () => {
            mockFetch.mockRejectedValueOnce(new Error('Network error'));

            await expect(
                sendMessage({ message: 'Test', author: 'User' })
            ).rejects.toThrow('Network error');
        });
    });
});
