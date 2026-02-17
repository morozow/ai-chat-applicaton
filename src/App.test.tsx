import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

// Mock the useMessages hook
vi.mock('./hooks/useMessages', () => ({
    useMessages: vi.fn(),
}));

// Import the mocked hook
import { useMessages } from './hooks/useMessages';

const mockUseMessages = vi.mocked(useMessages);

describe('App', () => {
    const defaultMockReturn = {
        messages: [],
        isLoading: false,
        isLoadingMore: false,
        isSending: false,
        error: null,
        sendMessage: vi.fn(),
        loadMore: vi.fn(),
        retry: vi.fn(),
        hasMore: false,
    };

    beforeEach(() => {
        vi.clearAllMocks();
        mockUseMessages.mockReturnValue(defaultMockReturn);
    });

    it('renders the chat layout', () => {
        render(<App />);
        // Check that the main layout is rendered
        expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('renders the message input form', () => {
        render(<App />);
        // Use more specific selectors to avoid matching aria-labels
        expect(screen.getByRole('textbox', { name: /^message$/i })).toBeInTheDocument();
        expect(screen.getByRole('textbox', { name: /your name/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument();
    });

    it('renders the message list with role="log"', () => {
        render(<App />);
        expect(screen.getByRole('log')).toBeInTheDocument();
    });

    it('displays loading state when isLoading is true', () => {
        mockUseMessages.mockReturnValue({
            ...defaultMockReturn,
            isLoading: true,
        });

        render(<App />);
        expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('displays error banner when error exists', () => {
        mockUseMessages.mockReturnValue({
            ...defaultMockReturn,
            error: new Error('Failed to fetch messages'),
        });

        render(<App />);
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByText(/failed to fetch messages/i)).toBeInTheDocument();
    });

    it('displays retry button when error exists', () => {
        const mockRetry = vi.fn();
        mockUseMessages.mockReturnValue({
            ...defaultMockReturn,
            error: new Error('Network error'),
            retry: mockRetry,
        });

        render(<App />);
        const retryButton = screen.getByRole('button', { name: /retry/i });
        expect(retryButton).toBeInTheDocument();
    });

    it('calls retry when retry button is clicked', async () => {
        const user = userEvent.setup();
        const mockRetry = vi.fn();
        mockUseMessages.mockReturnValue({
            ...defaultMockReturn,
            error: new Error('Network error'),
            retry: mockRetry,
        });

        render(<App />);
        const retryButton = screen.getByRole('button', { name: /retry/i });
        await user.click(retryButton);

        expect(mockRetry).toHaveBeenCalledTimes(1);
    });

    it('displays messages when available', () => {
        mockUseMessages.mockReturnValue({
            ...defaultMockReturn,
            messages: [
                {
                    id: '1',
                    message: 'Hello world',
                    author: 'John',
                    timestamp: '2024-01-01T10:00:00.000Z',
                },
                {
                    id: '2',
                    message: 'Hi there',
                    author: 'Jane',
                    timestamp: '2024-01-01T10:01:00.000Z',
                },
            ],
        });

        render(<App />);
        expect(screen.getByText('Hello world')).toBeInTheDocument();
        expect(screen.getByText('Hi there')).toBeInTheDocument();
        expect(screen.getByText('John')).toBeInTheDocument();
        expect(screen.getByText('Jane')).toBeInTheDocument();
    });

    it('disables input when isSending is true', () => {
        mockUseMessages.mockReturnValue({
            ...defaultMockReturn,
            isSending: true,
        });

        render(<App />);
        expect(screen.getByRole('textbox', { name: /^message$/i })).toBeDisabled();
        expect(screen.getByRole('textbox', { name: /your name/i })).toBeDisabled();
    });

    it('calls sendMessage when form is submitted with valid input', async () => {
        const user = userEvent.setup();
        const mockSendMessage = vi.fn().mockResolvedValue(undefined);
        mockUseMessages.mockReturnValue({
            ...defaultMockReturn,
            sendMessage: mockSendMessage,
        });

        render(<App />);

        const messageInput = screen.getByRole('textbox', { name: /^message$/i });
        const authorInput = screen.getByRole('textbox', { name: /your name/i });
        const sendButton = screen.getByRole('button', { name: /send/i });

        await user.type(messageInput, 'Test message');
        await user.type(authorInput, 'Test Author');
        await user.click(sendButton);

        await waitFor(() => {
            expect(mockSendMessage).toHaveBeenCalledWith('Test message', 'Test Author');
        });
    });

    it('shows load more button when hasMore is true', () => {
        mockUseMessages.mockReturnValue({
            ...defaultMockReturn,
            messages: [
                {
                    id: '1',
                    message: 'Hello',
                    author: 'John',
                    timestamp: '2024-01-01T10:00:00.000Z',
                },
            ],
            hasMore: true,
        });

        render(<App />);
        // The button has aria-label "Load older messages"
        expect(screen.getByRole('button', { name: /load older messages/i })).toBeInTheDocument();
    });

    it('calls loadMore when load more button is clicked', async () => {
        const user = userEvent.setup();
        const mockLoadMore = vi.fn();
        mockUseMessages.mockReturnValue({
            ...defaultMockReturn,
            messages: [
                {
                    id: '1',
                    message: 'Hello',
                    author: 'John',
                    timestamp: '2024-01-01T10:00:00.000Z',
                },
            ],
            hasMore: true,
            loadMore: mockLoadMore,
        });

        render(<App />);
        const loadMoreButton = screen.getByRole('button', { name: /load older messages/i });
        await user.click(loadMoreButton);

        expect(mockLoadMore).toHaveBeenCalledTimes(1);
    });

    it('shows empty state when no messages and not loading', () => {
        mockUseMessages.mockReturnValue({
            ...defaultMockReturn,
            messages: [],
            isLoading: false,
        });

        render(<App />);
        expect(screen.getByText(/no messages yet/i)).toBeInTheDocument();
    });
});
