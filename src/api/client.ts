/**
 * API Client for the Chat Application
 *
 * Provides a configured HTTP client for communicating with the Chat API.
 * Handles authentication, JSON serialization, and error responses.
 */

import type { ApiError } from '../types';

export interface ApiClientConfig {
    baseUrl: string;
    token: string;
}

export interface ApiClient {
    get<T>(path: string, params?: Record<string, string>): Promise<T>;
    post<T>(path: string, body: unknown): Promise<T>;
}

/**
 * Custom error class for API-related errors
 */
export class ApiClientError extends Error {
    readonly statusCode?: number;
    readonly apiError?: ApiError;

    constructor(message: string, statusCode?: number, apiError?: ApiError) {
        super(message);
        this.name = 'ApiClientError';
        this.statusCode = statusCode;
        this.apiError = apiError;
    }
}

/**
 * Custom error class for configuration errors
 */
export class ConfigurationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ConfigurationError';
    }
}

/**
 * Creates an API client with the given configuration.
 *
 * @param config - Configuration object containing baseUrl and token
 * @returns An ApiClient instance with get and post methods
 * @throws ConfigurationError if token is missing
 */
export function createApiClient(config: ApiClientConfig): ApiClient {
    if (!config.token) {
        throw new ConfigurationError(
            'API token is required. Please configure VITE_API_TOKEN in your environment.'
        );
    }

    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.token}`,
    };

    /**
     * Handles the response from the API, parsing JSON and handling errors.
     */
    async function handleResponse<T>(response: Response): Promise<T> {
        if (!response.ok) {
            let apiError: ApiError | undefined;
            try {
                apiError = await response.json();
            } catch {
                // Response body is not valid JSON
            }

            const message =
                apiError?.message || `HTTP error ${response.status}`;
            throw new ApiClientError(message, response.status, apiError);
        }

        return response.json() as Promise<T>;
    }

    return {
        /**
         * Performs a GET request to the specified path.
         *
         * @param path - The API endpoint path (e.g., '/api/v1/messages')
         * @param params - Optional query parameters
         * @returns The parsed JSON response
         */
        async get<T>(
            path: string,
            params?: Record<string, string>
        ): Promise<T> {
            const url = new URL(path, config.baseUrl);

            if (params) {
                Object.entries(params).forEach(([key, value]) => {
                    url.searchParams.append(key, value);
                });
            }

            const response = await fetch(url.toString(), {
                method: 'GET',
                headers,
            });

            return handleResponse<T>(response);
        },

        /**
         * Performs a POST request to the specified path.
         *
         * @param path - The API endpoint path (e.g., '/api/v1/messages')
         * @param body - The request body to be JSON serialized
         * @returns The parsed JSON response
         */
        async post<T>(path: string, body: unknown): Promise<T> {
            const url = new URL(path, config.baseUrl);

            const response = await fetch(url.toString(), {
                method: 'POST',
                headers,
                body: JSON.stringify(body),
            });

            return handleResponse<T>(response);
        },
    };
}
