/**
 * Messages Service
 *
 * Provides functions for fetching and sending chat messages
 * through the Chat API.
 */

import { config } from '../config';
import { createApiClient } from './client';
import type { Message, MessagesResponse, SendMessageRequest } from '../types';

/**
 * Parameters for fetching messages with optional pagination
 */
export interface FetchMessagesParams {
    after?: string;
    limit?: number;
}

/**
 * Parameters for sending a new message
 */
export interface SendMessageParams {
    message: string;
    author: string;
}

// Create a singleton API client instance
const apiClient = createApiClient({
    baseUrl: config.apiUrl,
    token: config.apiToken,
});

/**
 * Fetches messages from the Chat API.
 *
 * @param params - Optional pagination parameters
 * @param params.after - Fetch messages after this timestamp (ISO 8601)
 * @param params.limit - Maximum number of messages to fetch
 * @returns Array of messages
 */
export async function fetchMessages(
    params?: FetchMessagesParams
): Promise<Message[]> {
    const queryParams: Record<string, string> = {};

    if (params?.after) {
        queryParams.after = params.after;
    }

    if (params?.limit !== undefined) {
        queryParams.limit = String(params.limit);
    }

    const response = await apiClient.get<MessagesResponse>(
        '/api/v1/messages',
        Object.keys(queryParams).length > 0 ? queryParams : undefined
    );

    return response.messages;
}

/**
 * Sends a new message to the Chat API.
 *
 * @param params - Message parameters
 * @param params.message - The message text
 * @param params.author - The author name
 * @returns The created message
 */
export async function sendMessage(params: SendMessageParams): Promise<Message> {
    const body: SendMessageRequest = {
        message: params.message,
        author: params.author,
    };

    return apiClient.post<Message>('/api/v1/messages', body);
}
