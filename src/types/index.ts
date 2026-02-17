/**
 * Type definitions for the Chat Application
 * 
 * These types define the data structures used throughout the application
 * for messages, API communication, and application state management.
 */

/**
 * Represents a single chat message
 */
export interface Message {
    id: string;
    message: string;
    author: string;
    timestamp: string; // ISO 8601 format
}

/**
 * API response type for fetching messages
 */
export interface MessagesResponse {
    messages: Message[];
}

/**
 * Request body type for sending a new message
 */
export interface SendMessageRequest {
    message: string;
    author: string;
}

/**
 * API error response type
 */
export interface ApiError {
    error: string;
    message: string;
}

/**
 * Application state for managing messages
 */
export interface MessagesState {
    messages: Message[];
    isLoading: boolean;
    isSending: boolean;
    error: Error | null;
    oldestTimestamp: string | null;
    hasMore: boolean;
}
