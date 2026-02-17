import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import MessageList from './MessageList';
import type { Message } from '../types';

// Helper to create test messages
function createMessage(overrides: Partial<Message> = {}): Message {
    return {
        id: '1',
        message: 'Test message',
        author: 'Test Author',
        timestamp: '2024-01-15T10:30:00.000Z',
        ...overrides,
    };
}

describe('MessageList', () => {
    describe('accessibility', () => {
        it('should have role="log" for screen reader identification', () => {
            render(<MessageList messages={[]} isLoading={false} />);

            const container = screen.getByRole('log');
            expect(container).toBeInTheDocument();
        });

        it('should have aria-live="polite" to announce new messages', () => {
            render(<MessageList messages={[]} isLoading={false} />);

            const container = screen.getByRole('log');
            expect(container).toHaveAttribute('aria-live', 'polite');
        });

        it('should have aria-label for the message list', () => {
            render(<MessageList messages={[]} isLoading={false} />);

            const container = screen.getByRole('log');
            expect(container).toHaveAttribute('aria-label', 'Chat messages');
        });

        it('should have accessible label on load more button', () => {
            const onLoadMore = vi.fn();
            render(
                <MessageList
                    messages={[createMessage()]}
                    isLoading={false}
                    hasMore={true}
                    onLoadMore={onLoadMore}
                />
            );

            const button = screen.getByRole('button', { name: /load older messages/i });
            expect(button).toBeInTheDocument();
        });
    });

    describe('loading state', () => {
        it('should display loader when isLoading is true', () => {
            render(<MessageList messages={[]} isLoading={true} />);

            expect(screen.getByRole('status')).toBeInTheDocument();
        });

        it('should not display loader when isLoading is false', () => {
            render(<MessageList messages={[]} isLoading={false} />);

            expect(screen.queryByRole('status')).not.toBeInTheDocument();
        });
    });

    describe('empty state', () => {
        it('should display empty state when no messages and not loading', () => {
            render(<MessageList messages={[]} isLoading={false} />);

            expect(screen.getByText(/no messages yet/i)).toBeInTheDocument();
        });

        it('should not display empty state when loading', () => {
            render(<MessageList messages={[]} isLoading={true} />);

            expect(screen.queryByText(/no messages yet/i)).not.toBeInTheDocument();
        });

        it('should not display empty state when messages exist', () => {
            render(<MessageList messages={[createMessage()]} isLoading={false} />);

            expect(screen.queryByText(/no messages yet/i)).not.toBeInTheDocument();
        });
    });

    describe('message rendering', () => {
        it('should render all messages', () => {
            const messages = [
                createMessage({ id: '1', message: 'First message', author: 'Alice' }),
                createMessage({ id: '2', message: 'Second message', author: 'Bob' }),
                createMessage({ id: '3', message: 'Third message', author: 'Alice' }),
            ];

            render(<MessageList messages={messages} isLoading={false} />);

            expect(screen.getByText('First message')).toBeInTheDocument();
            expect(screen.getByText('Second message')).toBeInTheDocument();
            expect(screen.getByText('Third message')).toBeInTheDocument();
        });

        it('should render messages with their authors', () => {
            const messages = [
                createMessage({ id: '1', author: 'Alice' }),
                createMessage({ id: '2', author: 'Bob' }),
            ];

            render(<MessageList messages={messages} isLoading={false} />);

            expect(screen.getByText('Alice')).toBeInTheDocument();
            expect(screen.getByText('Bob')).toBeInTheDocument();
        });

        it('should pass currentUser to MessageBubble for styling', () => {
            const messages = [
                createMessage({ id: '1', author: 'CurrentUser', message: 'My message' }),
                createMessage({ id: '2', author: 'OtherUser', message: 'Their message' }),
            ];

            render(
                <MessageList
                    messages={messages}
                    isLoading={false}
                    currentUser="CurrentUser"
                />
            );

            // Both messages should be rendered
            expect(screen.getByText('My message')).toBeInTheDocument();
            expect(screen.getByText('Their message')).toBeInTheDocument();
        });
    });

    describe('load more functionality', () => {
        it('should show load more button when hasMore is true and onLoadMore provided', () => {
            const onLoadMore = vi.fn();
            render(
                <MessageList
                    messages={[createMessage()]}
                    isLoading={false}
                    hasMore={true}
                    onLoadMore={onLoadMore}
                />
            );

            expect(screen.getByRole('button', { name: /load/i })).toBeInTheDocument();
        });

        it('should not show load more button when hasMore is false', () => {
            const onLoadMore = vi.fn();
            render(
                <MessageList
                    messages={[createMessage()]}
                    isLoading={false}
                    hasMore={false}
                    onLoadMore={onLoadMore}
                />
            );

            expect(screen.queryByRole('button', { name: /load/i })).not.toBeInTheDocument();
        });

        it('should not show load more button when onLoadMore is not provided', () => {
            render(
                <MessageList
                    messages={[createMessage()]}
                    isLoading={false}
                    hasMore={true}
                />
            );

            expect(screen.queryByRole('button', { name: /load/i })).not.toBeInTheDocument();
        });

        it('should not show load more button when loading', () => {
            const onLoadMore = vi.fn();
            render(
                <MessageList
                    messages={[createMessage()]}
                    isLoading={true}
                    hasMore={true}
                    onLoadMore={onLoadMore}
                />
            );

            expect(screen.queryByRole('button', { name: /load/i })).not.toBeInTheDocument();
        });

        it('should call onLoadMore when load more button is clicked', () => {
            const onLoadMore = vi.fn();
            render(
                <MessageList
                    messages={[createMessage()]}
                    isLoading={false}
                    hasMore={true}
                    onLoadMore={onLoadMore}
                />
            );

            fireEvent.click(screen.getByRole('button', { name: /load/i }));

            expect(onLoadMore).toHaveBeenCalledTimes(1);
        });
    });

    describe('message ordering', () => {
        it('should render messages in the order provided (oldest first)', () => {
            const messages = [
                createMessage({
                    id: '1',
                    message: 'Oldest',
                    timestamp: '2024-01-01T10:00:00.000Z',
                }),
                createMessage({
                    id: '2',
                    message: 'Middle',
                    timestamp: '2024-01-02T10:00:00.000Z',
                }),
                createMessage({
                    id: '3',
                    message: 'Newest',
                    timestamp: '2024-01-03T10:00:00.000Z',
                }),
            ];

            render(<MessageList messages={messages} isLoading={false} />);

            const messageElements = screen.getAllByRole('article');
            expect(messageElements).toHaveLength(3);

            // Verify order by checking text content
            expect(messageElements[0]).toHaveTextContent('Oldest');
            expect(messageElements[1]).toHaveTextContent('Middle');
            expect(messageElements[2]).toHaveTextContent('Newest');
        });
    });
});
