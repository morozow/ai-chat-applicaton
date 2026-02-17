/**
 * API Client for the Chat API
 * 
 * Handles HTTP communication with the Chat API, including
 * authentication and JSON serialization.
 */

import { config } from '../config';

export interface ApiClientConfig {
    baseUrl: string;
    token: string;
}

export interface ApiClient {
    get<T>(path: string, params?: Record<string, string>): Promise<T>;
    post<T>(path: string, body: unknown): Promise<T>;
}

/**
 * Creates an API client with the given configuration.
 * All requests include the Authorization header with the bearer token.
 */
export function createApiClient(clientConfig: ApiClientConfig): ApiClient {
    const { baseUrl, token } = clientConfig;

    if (!token) {
        throw new Error('API token is required');
    }

    const headers: HeadersInit = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
    };

    async function handleResponse<T>(response: Response): Promise<T> {
        if (!response.ok) {
            const errorBody = await response.text();
            let errorMessage: string;
            try {
                const errorJson = JSON.parse(errorBody);
                // Handle various error response formats
                if (typeof errorJson === 'string') {
                    errorMessage = errorJson;
                } else if (errorJson.message) {
                    errorMessage = errorJson.message;
                } else if (errorJson.error) {
                    errorMessage = typeof errorJson.error === 'string'
                        ? errorJson.error
                        : JSON.stringify(errorJson.error);
                } else {
                    // Fallback: stringify the entire error object
                    errorMessage = JSON.stringify(errorJson);
                }
            } catch {
                errorMessage = errorBody || response.statusText;
            }
            throw new Error(errorMessage || 'An unknown error occurred');
        }
        return response.json() as Promise<T>;
    }

    return {
        async get<T>(path: string, params?: Record<string, string>): Promise<T> {
            const url = new URL(path, baseUrl);
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

        async post<T>(path: string, body: unknown): Promise<T> {
            const url = new URL(path, baseUrl);
            const response = await fetch(url.toString(), {
                method: 'POST',
                headers,
                body: JSON.stringify(body),
            });
            return handleResponse<T>(response);
        },
    };
}

// Default API client instance using environment configuration
export const apiClient = createApiClient({
    baseUrl: config.apiUrl,
    token: config.apiToken,
});
