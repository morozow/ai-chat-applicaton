/**
 * Unit tests for the API Client
 *
 * Tests cover:
 * - Configuration validation
 * - Authorization header inclusion
 * - GET and POST request handling
 * - Error response handling
 * - JSON serialization
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    createApiClient,
    ApiClientError,
    ConfigurationError,
} from './client';

describe('createApiClient', () => {
    const mockConfig = {
        baseUrl: 'http://localhost:3000',
        token: 'test-token',
    };

    beforeEach(() => {
        vi.stubGlobal('fetch', vi.fn());
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    describe('configuration validation', () => {
        it('should throw ConfigurationError when token is missing', () => {
            expect(() =>
                createApiClient({ baseUrl: 'http://localhost:3000', token: '' })
            ).toThrow(ConfigurationError);
        });

        it('should throw ConfigurationError with descriptive message when token is missing', () => {
            expect(() =>
                createApiClient({ baseUrl: 'http://localhost:3000', token: '' })
            ).toThrow('API token is required');
        });

        it('should create client successfully with valid config', () => {
            const client = createApiClient(mockConfig);
            expect(client).toBeDefined();
            expect(client.get).toBeDefined();
            expect(client.post).toBeDefined();
        });
    });

    describe('get method', () => {
        it('should include Authorization header with Bearer token', async () => {
            const mockResponse = { messages: [] };
            vi.mocked(fetch).mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockResponse),
            } as Response);

            const client = createApiClient(mockConfig);
            await client.get('/api/v1/messages');

            expect(fetch).toHaveBeenCalledWith(
                'http://localhost:3000/api/v1/messages',
                expect.objectContaining({
                    headers: expect.objectContaining({
                        Authorization: 'Bearer test-token',
                    }),
                })
            );
        });

        it('should include Content-Type header', async () => {
            const mockResponse = { messages: [] };
            vi.mocked(fetch).mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockResponse),
            } as Response);

            const client = createApiClient(mockConfig);
            await client.get('/api/v1/messages');

            expect(fetch).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    headers: expect.objectContaining({
                        'Content-Type': 'application/json',
                    }),
                })
            );
        });

        it('should append query parameters to URL', async () => {
            const mockResponse = { messages: [] };
            vi.mocked(fetch).mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockResponse),
            } as Response);

            const client = createApiClient(mockConfig);
            await client.get('/api/v1/messages', {
                after: '2023-01-01T00:00:00.000Z',
                limit: '10',
            });

            expect(fetch).toHaveBeenCalledWith(
                'http://localhost:3000/api/v1/messages?after=2023-01-01T00%3A00%3A00.000Z&limit=10',
                expect.any(Object)
            );
        });

        it('should return parsed JSON response on success', async () => {
            const mockResponse = {
                messages: [{ id: '1', message: 'Hello', author: 'John', timestamp: '2023-01-01T00:00:00.000Z' }],
            };
            vi.mocked(fetch).mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockResponse),
            } as Response);

            const client = createApiClient(mockConfig);
            const result = await client.get('/api/v1/messages');

            expect(result).toEqual(mockResponse);
        });

        it('should throw ApiClientError on HTTP error', async () => {
            vi.mocked(fetch).mockResolvedValueOnce({
                ok: false,
                status: 401,
                json: () =>
                    Promise.resolve({
                        error: 'Unauthorized',
                        message: 'Invalid token',
                    }),
            } as Response);

            const client = createApiClient(mockConfig);

            await expect(client.get('/api/v1/messages')).rejects.toThrow(
                ApiClientError
            );
        });

        it('should include status code in ApiClientError', async () => {
            vi.mocked(fetch).mockResolvedValueOnce({
                ok: false,
                status: 401,
                json: () =>
                    Promise.resolve({
                        error: 'Unauthorized',
                        message: 'Invalid token',
                    }),
            } as Response);

            const client = createApiClient(mockConfig);

            try {
                await client.get('/api/v1/messages');
            } catch (error) {
                expect(error).toBeInstanceOf(ApiClientError);
                expect((error as ApiClientError).statusCode).toBe(401);
            }
        });

        it('should handle non-JSON error responses', async () => {
            vi.mocked(fetch).mockResolvedValueOnce({
                ok: false,
                status: 500,
                json: () => Promise.reject(new Error('Invalid JSON')),
            } as Response);

            const client = createApiClient(mockConfig);

            await expect(client.get('/api/v1/messages')).rejects.toThrow(
                'HTTP error 500'
            );
        });
    });

    describe('post method', () => {
        it('should include Authorization header with Bearer token', async () => {
            const mockResponse = {
                id: '1',
                message: 'Hello',
                author: 'John',
                timestamp: '2023-01-01T00:00:00.000Z',
            };
            vi.mocked(fetch).mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockResponse),
            } as Response);

            const client = createApiClient(mockConfig);
            await client.post('/api/v1/messages', {
                message: 'Hello',
                author: 'John',
            });

            expect(fetch).toHaveBeenCalledWith(
                'http://localhost:3000/api/v1/messages',
                expect.objectContaining({
                    headers: expect.objectContaining({
                        Authorization: 'Bearer test-token',
                    }),
                })
            );
        });

        it('should serialize body as JSON', async () => {
            const mockResponse = {
                id: '1',
                message: 'Hello',
                author: 'John',
                timestamp: '2023-01-01T00:00:00.000Z',
            };
            vi.mocked(fetch).mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockResponse),
            } as Response);

            const client = createApiClient(mockConfig);
            await client.post('/api/v1/messages', {
                message: 'Hello',
                author: 'John',
            });

            expect(fetch).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    body: JSON.stringify({ message: 'Hello', author: 'John' }),
                })
            );
        });

        it('should use POST method', async () => {
            const mockResponse = {
                id: '1',
                message: 'Hello',
                author: 'John',
                timestamp: '2023-01-01T00:00:00.000Z',
            };
            vi.mocked(fetch).mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockResponse),
            } as Response);

            const client = createApiClient(mockConfig);
            await client.post('/api/v1/messages', {
                message: 'Hello',
                author: 'John',
            });

            expect(fetch).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    method: 'POST',
                })
            );
        });

        it('should return parsed JSON response on success', async () => {
            const mockResponse = {
                id: '1',
                message: 'Hello',
                author: 'John',
                timestamp: '2023-01-01T00:00:00.000Z',
            };
            vi.mocked(fetch).mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockResponse),
            } as Response);

            const client = createApiClient(mockConfig);
            const result = await client.post('/api/v1/messages', {
                message: 'Hello',
                author: 'John',
            });

            expect(result).toEqual(mockResponse);
        });

        it('should throw ApiClientError on HTTP error', async () => {
            vi.mocked(fetch).mockResolvedValueOnce({
                ok: false,
                status: 400,
                json: () =>
                    Promise.resolve({
                        error: 'Bad Request',
                        message: 'Message is required',
                    }),
            } as Response);

            const client = createApiClient(mockConfig);

            await expect(
                client.post('/api/v1/messages', { message: '', author: 'John' })
            ).rejects.toThrow(ApiClientError);
        });

        it('should include API error details in ApiClientError', async () => {
            const apiError = {
                error: 'Bad Request',
                message: 'Message is required',
            };
            vi.mocked(fetch).mockResolvedValueOnce({
                ok: false,
                status: 400,
                json: () => Promise.resolve(apiError),
            } as Response);

            const client = createApiClient(mockConfig);

            try {
                await client.post('/api/v1/messages', {
                    message: '',
                    author: 'John',
                });
            } catch (error) {
                expect(error).toBeInstanceOf(ApiClientError);
                expect((error as ApiClientError).apiError).toEqual(apiError);
            }
        });
    });
});
