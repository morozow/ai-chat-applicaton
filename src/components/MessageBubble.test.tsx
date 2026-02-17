import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import MessageBubble from './MessageBubble';
import type { Message } from '../types';

describe('MessageBubble', () => {
    const createMessage = (overrides: Partial<Message> = {}): Message => ({
        id: '1',
        message: 'Hello, world!',
        author: 'John Doe',
        timestamp: '2024-01-15T10:30:00.000Z',
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
            const message = createMessage({ timestamp: '2024-01-15T10:30:00.000Z' });
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
                timestamp: '2024-06-20T14:45:00.000Z',
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
            const message = createMessage({ timestamp: '2024-12-25T08:00:00.000Z' });
            render(<MessageBubble message={message} />);

            const timeElement = screen.getByRole('time');
            expect(timeElement.textContent).toMatch(/Dec\s+25,\s+2024/);
        });

        it('handles timestamps with different times', () => {
            const message = createMessage({ timestamp: '2024-03-10T23:59:00.000Z' });
            render(<MessageBubble message={message} />);

            const timeElement = screen.getByRole('time');
            expect(timeElement).toBeInTheDocument();
        });

        it('handles invalid timestamps gracefully', () => {
            const message = createMessage({ timestamp: 'invalid-date' });
            render(<MessageBubble message={message} />);

            // Should not render a time element for invalid timestamps
            expect(screen.queryByRole('time')).not.toBeInTheDocument();
        });

        it('handles empty timestamps gracefully', () => {
            const message = createMessage({ timestamp: '' });
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
            const message = createMessage({ timestamp: '2024-01-01T12:00:00.000Z' });
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
