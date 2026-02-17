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
                errorMessage = extractErrorMessage(errorJson);
            } catch {
                errorMessage = errorBody || response.statusText;
            }
            throw new Error(errorMessage || 'An unknown error occurred');
        }
        return response.json() as Promise<T>;
    }

    /**
     * Extracts a human-readable error message from various API error formats.
     * Handles validation errors with multiple field messages.
     */
    function extractErrorMessage(errorJson: unknown): string {
        if (typeof errorJson === 'string') {
            return errorJson;
        }

        if (typeof errorJson !== 'object' || errorJson === null) {
            return JSON.stringify(errorJson);
        }

        const obj = errorJson as Record<string, unknown>;

        // Direct message field
        if (typeof obj.message === 'string') {
            return obj.message;
        }

        // Handle error object with nested message array (validation errors)
        // Format: { error: { message: [{ field: "author", message: "..." }] } }
        if (obj.error && typeof obj.error === 'object') {
            const errorObj = obj.error as Record<string, unknown>;

            // Check for validation error array
            if (Array.isArray(errorObj.message)) {
                const messages = errorObj.message
                    .map((item: unknown) => {
                        if (typeof item === 'object' && item !== null) {
                            const validationError = item as Record<string, unknown>;
                            // Format: "Field: message" for clarity
                            if (validationError.field && validationError.message) {
                                return `${capitalize(String(validationError.field))}: ${validationError.message}`;
                            }
                            if (validationError.message) {
                                return String(validationError.message);
                            }
                        }
                        return typeof item === 'string' ? item : JSON.stringify(item);
                    })
                    .filter(Boolean);

                if (messages.length > 0) {
                    return messages.join('\n');
                }
            }

            // Simple string error
            if (typeof errorObj.message === 'string') {
                return errorObj.message;
            }

            // Error is a string
            if (typeof obj.error === 'string') {
                return obj.error;
            }
        }

        // Fallback: stringify the entire object
        return JSON.stringify(errorJson);
    }

    function capitalize(str: string): string {
        return str.charAt(0).toUpperCase() + str.slice(1);
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
