import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import * as fc from 'fast-check';
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
        /**
         * Accessibility tests for Requirements 9.1, 9.2
         * Testing role and aria attributes on MessageList
         */
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

        /**
         * Additional accessibility tests for Requirements 9.1, 9.2
         * Testing that role and aria-live are present together for proper screen reader support
         */
        it('should have both role="log" and aria-live="polite" on the same element', () => {
            render(<MessageList messages={[]} isLoading={false} />);

            const container = screen.getByRole('log');
            expect(container).toHaveAttribute('role', 'log');
            expect(container).toHaveAttribute('aria-live', 'polite');
        });

        it('should have aria-label attribute on load more button', () => {
            const onLoadMore = vi.fn();
            render(
                <MessageList
                    messages={[createMessage()]}
                    isLoading={false}
                    hasMore={true}
                    onLoadMore={onLoadMore}
                />
            );

            const button = screen.getByRole('button', { name: /load/i });
            expect(button).toHaveAttribute('aria-label', 'Load older messages');
        });

        it('should render messages as articles for semantic structure', () => {
            const messages = [
                createMessage({ id: '1', message: 'First message' }),
                createMessage({ id: '2', message: 'Second message' }),
            ];

            render(<MessageList messages={messages} isLoading={false} />);

            const articles = screen.getAllByRole('article');
            expect(articles).toHaveLength(2);
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


/**
 * Property-Based Tests
 * Feature: chat-application, Property 2: Message Chronological Ordering
 * **Validates: Requirements 2.3**
 *
 * Property: For any array of messages displayed in the Message_List, the messages
 * SHALL be ordered chronologically with the oldest message at the top (lowest index)
 * and the newest message at the bottom (highest index).
 *
 * Note: The MessageList component preserves the order of messages as provided.
 * The caller (useMessages hook) is responsible for sorting messages chronologically.
 * This test verifies that the component renders messages in the exact order provided.
 */
describe('Feature: chat-application, Property 2: Message Chronological Ordering', () => {
    // Generate valid ISO timestamp strings using integer timestamps
    const timestampArbitrary = fc
        .integer({ min: 1577836800000, max: 1893456000000 }) // 2020-01-01 to 2030-01-01
        .map((ms) => new Date(ms).toISOString());

    // Arbitrary for generating valid Message objects
    const messageArbitrary = fc.record({
        id: fc.uuid(),
        message: fc.string({ minLength: 1, maxLength: 200 }),
        author: fc.string({ minLength: 1, maxLength: 50 }),
        timestamp: timestampArbitrary,
    });

    // Arbitrary for generating arrays of messages (1-20 messages)
    const messagesArbitrary = fc.array(messageArbitrary, { minLength: 1, maxLength: 20 });

    it('should render messages in the exact order provided (preserving chronological order)', () => {
        fc.assert(
            fc.property(messagesArbitrary, (messages) => {
                const { container } = render(
                    <MessageList messages={messages} isLoading={false} />
                );

                // Get all rendered message articles
                const messageElements = container.querySelectorAll('article');

                // The number of rendered messages should match input
                expect(messageElements.length).toBe(messages.length);

                // Each message should be rendered in the same order as provided
                messages.forEach((message, index) => {
                    const element = messageElements[index];
                    // Verify the message text is present in the correct position
                    expect(element.textContent).toContain(message.message);
                    expect(element.textContent).toContain(message.author);
                });

                // Cleanup for next iteration
                container.remove();
            }),
            { numRuns: 20 }
        );
    });

    it('should maintain message order when messages are sorted chronologically (oldest first)', () => {
        fc.assert(
            fc.property(messagesArbitrary, (unsortedMessages) => {
                // Sort messages chronologically (oldest first, as required by 2.3)
                const sortedMessages = [...unsortedMessages].sort(
                    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
                );

                const { container } = render(
                    <MessageList messages={sortedMessages} isLoading={false} />
                );

                const messageElements = container.querySelectorAll('article');

                // Verify messages are rendered in chronological order
                expect(messageElements.length).toBe(sortedMessages.length);

                // The first rendered message should be the oldest
                if (sortedMessages.length > 0) {
                    expect(messageElements[0].textContent).toContain(sortedMessages[0].message);
                }

                // The last rendered message should be the newest
                if (sortedMessages.length > 1) {
                    const lastIndex = sortedMessages.length - 1;
                    expect(messageElements[lastIndex].textContent).toContain(
                        sortedMessages[lastIndex].message
                    );
                }

                // Verify all messages maintain their sorted order
                sortedMessages.forEach((message, index) => {
                    expect(messageElements[index].textContent).toContain(message.message);
                });

                // Cleanup for next iteration
                container.remove();
            }),
            { numRuns: 20 }
        );
    });
});
