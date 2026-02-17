/**
 * Messages Service
 * 
 * Provides functions for fetching and sending chat messages
 * through the Chat API.
 */

import { apiClient, type ApiClient } from './client';
import type { Message, MessagesResponse, SendMessageRequest } from '../types';

export interface FetchMessagesParams {
    after?: string;
    limit?: number;
}

/**
 * Fetches messages from the Chat API.
 * Messages are returned in reverse chronological order from the API.
 * 
 * @param params - Optional parameters for pagination
 * @param client - Optional API client (defaults to the singleton)
 * @returns Array of messages
 */
export async function fetchMessages(
    params?: FetchMessagesParams,
    client: ApiClient = apiClient
): Promise<Message[]> {
    const queryParams: Record<string, string> = {};

    if (params?.after) {
        queryParams.after = params.after;
    }
    if (params?.limit !== undefined) {
        queryParams.limit = String(params.limit);
    }

    const response = await client.get<MessagesResponse>(
        '/api/v1/messages',
        Object.keys(queryParams).length > 0 ? queryParams : undefined
    );

    return response.messages;
}

/**
 * Sends a new message to the Chat API.
 * 
 * @param params - The message content and author
 * @param client - Optional API client (defaults to the singleton)
 * @returns The created message
 */
export async function sendMessage(
    params: SendMessageRequest,
    client: ApiClient = apiClient
): Promise<Message> {
    return client.post<Message>('/api/v1/messages', params);
}
