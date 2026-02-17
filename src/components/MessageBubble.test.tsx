import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import * as fc from 'fast-check';
import MessageBubble from './MessageBubble';
import type { Message } from '../types';

describe('MessageBubble', () => {
    const createMessage = (overrides: Partial<Message> = {}): Message => ({
        id: '1',
        message: 'Hello, world!',
        author: 'John Doe',
        createdAt: '2024-01-15T10:30:00.000Z',
        ...overrides,
    });

    describe('rendering', () => {
        it('displays the author name', () => {
            const message = createMessage({ author: 'Alice' });
            render(<MessageBubble message={message} />);

            expect(screen.getByText('Alice')).toBeInTheDocument();
        });

        it('displays the message text', () => {
            const message = createMessage({ message: 'Test message content' });
            render(<MessageBubble message={message} />);

            expect(screen.getByText('Test message content')).toBeInTheDocument();
        });

        it('displays a formatted timestamp', () => {
            const message = createMessage({ createdAt: '2024-01-15T10:30:00.000Z' });
            render(<MessageBubble message={message} />);

            // The timestamp should be formatted as human-readable
            const timeElement = screen.getByRole('time');
            expect(timeElement).toBeInTheDocument();
            expect(timeElement).toHaveAttribute('dateTime', '2024-01-15T10:30:00.000Z');
            // Check that it contains some formatted date text (locale-dependent)
            expect(timeElement.textContent).toMatch(/Jan\s+15,\s+2024/);
        });

        it('renders all message fields together', () => {
            const message = createMessage({
                author: 'Bob',
                message: 'Complete message',
                createdAt: '2024-06-20T14:45:00.000Z',
            });
            render(<MessageBubble message={message} />);

            expect(screen.getByText('Bob')).toBeInTheDocument();
            expect(screen.getByText('Complete message')).toBeInTheDocument();
            expect(screen.getByRole('time')).toBeInTheDocument();
        });
    });

    describe('styling based on author', () => {
        it('applies own styling when isCurrentUser is true', () => {
            const message = createMessage();
            const { container } = render(<MessageBubble message={message} isCurrentUser={true} />);

            const bubble = container.querySelector('article');
            expect(bubble?.className).toContain('own');
            expect(bubble?.className).not.toContain('other');
        });

        it('applies other styling when isCurrentUser is false', () => {
            const message = createMessage();
            const { container } = render(<MessageBubble message={message} isCurrentUser={false} />);

            const bubble = container.querySelector('article');
            expect(bubble?.className).toContain('other');
            expect(bubble?.className).not.toContain('own');
        });

        it('defaults to other styling when isCurrentUser is not provided', () => {
            const message = createMessage();
            const { container } = render(<MessageBubble message={message} />);

            const bubble = container.querySelector('article');
            expect(bubble?.className).toContain('other');
        });
    });

    describe('timestamp formatting', () => {
        it('handles valid ISO timestamps', () => {
            const message = createMessage({ createdAt: '2024-12-25T08:00:00.000Z' });
            render(<MessageBubble message={message} />);

            const timeElement = screen.getByRole('time');
            expect(timeElement.textContent).toMatch(/Dec\s+25,\s+2024/);
        });

        it('handles timestamps with different times', () => {
            const message = createMessage({ createdAt: '2024-03-10T23:59:00.000Z' });
            render(<MessageBubble message={message} />);

            const timeElement = screen.getByRole('time');
            expect(timeElement).toBeInTheDocument();
        });

        it('handles invalid timestamps gracefully', () => {
            const message = createMessage({ createdAt: 'invalid-date' });
            render(<MessageBubble message={message} />);

            // Should not render a time element for invalid timestamps
            expect(screen.queryByRole('time')).not.toBeInTheDocument();
        });

        it('handles empty timestamps gracefully', () => {
            const message = createMessage({ createdAt: '' });
            render(<MessageBubble message={message} />);

            expect(screen.queryByRole('time')).not.toBeInTheDocument();
        });
    });

    describe('accessibility', () => {
        it('uses semantic article element', () => {
            const message = createMessage();
            render(<MessageBubble message={message} />);

            expect(screen.getByRole('article')).toBeInTheDocument();
        });

        it('has aria-label with author name', () => {
            const message = createMessage({ author: 'Jane' });
            render(<MessageBubble message={message} />);

            expect(screen.getByLabelText('Message from Jane')).toBeInTheDocument();
        });

        it('uses time element with dateTime attribute', () => {
            const message = createMessage({ createdAt: '2024-01-01T12:00:00.000Z' });
            render(<MessageBubble message={message} />);

            const timeElement = screen.getByRole('time');
            expect(timeElement).toHaveAttribute('dateTime', '2024-01-01T12:00:00.000Z');
        });
    });

    describe('message content', () => {
        it('preserves whitespace in message text', () => {
            const message = createMessage({ message: 'Line 1\nLine 2\nLine 3' });
            const { container } = render(<MessageBubble message={message} />);

            // The text content should preserve newlines (CSS white-space: pre-wrap handles display)
            const textElement = container.querySelector('p');
            expect(textElement?.textContent).toBe('Line 1\nLine 2\nLine 3');
        });

        it('handles long messages', () => {
            const longMessage = 'A'.repeat(500);
            const message = createMessage({ message: longMessage });
            render(<MessageBubble message={message} />);

            expect(screen.getByText(longMessage)).toBeInTheDocument();
        });

        it('handles special characters in author name', () => {
            const message = createMessage({ author: 'José García' });
            render(<MessageBubble message={message} />);

            expect(screen.getByText('José García')).toBeInTheDocument();
        });

        it('handles special characters in message', () => {
            const message = createMessage({ message: 'Hello! @#$%^&*() <script>alert("xss")</script>' });
            render(<MessageBubble message={message} />);

            expect(screen.getByText('Hello! @#$%^&*() <script>alert("xss")</script>')).toBeInTheDocument();
        });
    });
});

describe('Feature: chat-application, Property 3: Message Rendering Completeness', () => {
    /**
     * **Validates: Requirements 3.1, 3.2, 3.3**
     *
     * Property: For any Message object with non-empty author, message, and timestamp fields,
     * the rendered MessageBubble SHALL contain the author name, the message text,
     * and a human-readable formatted timestamp.
     */
    it('renders author, message text, and formatted timestamp for any valid message', () => {
        // Generator for non-empty strings (author and message)
        const nonEmptyString = fc.string({ minLength: 1 }).filter(s => s.trim().length > 0);

        // Generator for valid ISO 8601 timestamps using integer components
        const validTimestamp = fc.tuple(
            fc.integer({ min: 2000, max: 2099 }), // year
            fc.integer({ min: 0, max: 11 }),      // month (0-indexed)
            fc.integer({ min: 1, max: 28 }),      // day (safe for all months)
            fc.integer({ min: 0, max: 23 }),      // hour
            fc.integer({ min: 0, max: 59 }),      // minute
            fc.integer({ min: 0, max: 59 }),      // second
        ).map(([year, month, day, hour, minute, second]) => {
            const date = new Date(Date.UTC(year, month, day, hour, minute, second));
            return date.toISOString();
        });

        // Generator for valid Message objects
        const validMessage = fc.record({
            id: fc.uuid(),
            author: nonEmptyString,
            message: nonEmptyString,
            createdAt: validTimestamp,
        });

        fc.assert(
            fc.property(validMessage, (message) => {
                const { container, unmount } = render(<MessageBubble message={message} />);

                try {
                    // Requirement 3.1: Author name is visible
                    const authorElement = container.querySelector('[class*="author"]');
                    expect(authorElement).not.toBeNull();
                    expect(authorElement?.textContent).toBe(message.author);

                    // Requirement 3.2: Message text is visible
                    const textElement = container.querySelector('p');
                    expect(textElement).not.toBeNull();
                    expect(textElement?.textContent).toBe(message.message);

                    // Requirement 3.3: Formatted timestamp is visible
                    const timeElement = container.querySelector('time');
                    expect(timeElement).not.toBeNull();
                    expect(timeElement?.getAttribute('dateTime')).toBe(message.createdAt);
                    // Verify the timestamp is human-readable (not empty)
                    expect(timeElement?.textContent).not.toBe('');
                    expect(timeElement?.textContent?.length).toBeGreaterThan(0);

                    return true;
                } finally {
                    unmount();
                }
            }),
            { numRuns: 20 }
        );
    });
});

