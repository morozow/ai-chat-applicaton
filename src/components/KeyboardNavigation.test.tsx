import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MessageInput from './MessageInput';
import ErrorBanner from './ErrorBanner';
import MessageList from './MessageList';
import type { Message } from '../types';

/**
 * Keyboard Navigation Tests
 * Feature: chat-application
 * **Validates: Requirements 8.1, 8.4**
 * 
 * 8.1: THE Chat_Application SHALL support Tab and Shift+Tab navigation between interactive elements
 * 8.4: THE Chat_Application SHALL provide visible focus indicators on all interactive elements
 */
describe('Keyboard Navigation - Requirements 8.1, 8.4', () => {
    describe('Tab Navigation Order (Requirement 8.1)', () => {
        it('should navigate through MessageInput elements with Tab key in correct order', async () => {
            const user = userEvent.setup();
            const mockOnSend = vi.fn().mockResolvedValue(undefined);

            // Provide valid input so send button is enabled and focusable
            render(<MessageInput onSend={mockOnSend} defaultAuthor="User" />);

            // Get all interactive elements
            const messageTextarea = screen.getByLabelText(/^message$/i);
            const authorInput = screen.getByLabelText(/your name/i);
            const sendButton = screen.getByRole('button', { name: /send/i });

            // Fill in message to enable the send button
            await user.type(messageTextarea, 'Test message');

            // Start by focusing the first element
            messageTextarea.focus();
            expect(document.activeElement).toBe(messageTextarea);

            // Tab to author input
            await user.tab();
            expect(document.activeElement).toBe(authorInput);

            // Tab to send button (now enabled)
            await user.tab();
            expect(document.activeElement).toBe(sendButton);
        });

        it('should navigate backwards through MessageInput elements with Shift+Tab', async () => {
            const user = userEvent.setup();
            const mockOnSend = vi.fn().mockResolvedValue(undefined);

            // Provide valid input so send button is enabled and focusable
            render(<MessageInput onSend={mockOnSend} defaultAuthor="User" />);

            const messageTextarea = screen.getByLabelText(/^message$/i);
            const authorInput = screen.getByLabelText(/your name/i);
            const sendButton = screen.getByRole('button', { name: /send/i });

            // Fill in message to enable the send button
            await user.type(messageTextarea, 'Test message');

            // Start at the send button
            sendButton.focus();
            expect(document.activeElement).toBe(sendButton);

            // Shift+Tab to author input
            await user.tab({ shift: true });
            expect(document.activeElement).toBe(authorInput);

            // Shift+Tab to message textarea
            await user.tab({ shift: true });
            expect(document.activeElement).toBe(messageTextarea);
        });

        it('should allow Tab navigation to ErrorBanner retry button', async () => {
            const user = userEvent.setup();
            const mockRetry = vi.fn();

            render(<ErrorBanner message="Test error" onRetry={mockRetry} />);

            const retryButton = screen.getByRole('button', { name: /retry/i });

            // Tab should reach the retry button
            await user.tab();
            expect(document.activeElement).toBe(retryButton);
        });

        it('should allow Tab navigation to MessageList load more button', async () => {
            const user = userEvent.setup();
            const mockLoadMore = vi.fn();
            const messages: Message[] = [{
                id: '1',
                message: 'Test',
                author: 'User',
                timestamp: new Date().toISOString()
            }];

            render(
                <MessageList
                    messages={messages}
                    isLoading={false}
                    hasMore={true}
                    onLoadMore={mockLoadMore}
                />
            );

            const loadMoreButton = screen.getByRole('button', { name: /load older messages/i });

            // Tab should reach the load more button
            await user.tab();
            expect(document.activeElement).toBe(loadMoreButton);
        });
    });

    describe('Focus Indicators (Requirement 8.4)', () => {
        it('message textarea should be focusable', () => {
            const mockOnSend = vi.fn().mockResolvedValue(undefined);
            render(<MessageInput onSend={mockOnSend} />);

            const textarea = screen.getByLabelText(/^message$/i);
            textarea.focus();

            expect(document.activeElement).toBe(textarea);
            // Verify the element can receive focus (tabIndex should not be -1)
            expect(textarea.tabIndex).not.toBe(-1);
        });

        it('author input should be focusable', () => {
            const mockOnSend = vi.fn().mockResolvedValue(undefined);
            render(<MessageInput onSend={mockOnSend} />);

            const input = screen.getByLabelText(/your name/i);
            input.focus();

            expect(document.activeElement).toBe(input);
            expect(input.tabIndex).not.toBe(-1);
        });

        it('send button should be focusable when enabled', async () => {
            const user = userEvent.setup();
            const mockOnSend = vi.fn().mockResolvedValue(undefined);
            render(<MessageInput onSend={mockOnSend} defaultAuthor="User" />);

            // Fill in message to enable the button
            const textarea = screen.getByLabelText(/^message$/i);
            await user.type(textarea, 'Test message');

            const button = screen.getByRole('button', { name: /send/i });
            button.focus();

            expect(document.activeElement).toBe(button);
            expect(button.tabIndex).not.toBe(-1);
            expect(button).not.toBeDisabled();
        });

        it('retry button should be focusable', () => {
            const mockRetry = vi.fn();
            render(<ErrorBanner message="Test error" onRetry={mockRetry} />);

            const button = screen.getByRole('button', { name: /retry/i });
            button.focus();

            expect(document.activeElement).toBe(button);
            expect(button.tabIndex).not.toBe(-1);
        });

        it('load more button should be focusable', () => {
            const mockLoadMore = vi.fn();
            const messages: Message[] = [{
                id: '1',
                message: 'Test',
                author: 'User',
                timestamp: new Date().toISOString()
            }];

            render(
                <MessageList
                    messages={messages}
                    isLoading={false}
                    hasMore={true}
                    onLoadMore={mockLoadMore}
                />
            );

            const button = screen.getByRole('button', { name: /load older messages/i });
            button.focus();

            expect(document.activeElement).toBe(button);
            expect(button.tabIndex).not.toBe(-1);
        });

        it('disabled send button should not be focusable via tab when disabled', async () => {
            const user = userEvent.setup();
            const mockOnSend = vi.fn().mockResolvedValue(undefined);

            // Render with disabled state (empty inputs = disabled button)
            render(<MessageInput onSend={mockOnSend} />);

            const authorInput = screen.getByLabelText(/your name/i);
            const sendButton = screen.getByRole('button', { name: /send/i });

            // Verify button is disabled
            expect(sendButton).toBeDisabled();

            // Focus the author input
            authorInput.focus();
            expect(document.activeElement).toBe(authorInput);

            // Tab should skip the disabled button
            await user.tab();
            // The focus should move past the disabled button (not to it)
            expect(document.activeElement).not.toBe(sendButton);
        });
    });

    describe('Keyboard Activation of Interactive Elements', () => {
        it('should activate send button with Enter key when focused', async () => {
            const user = userEvent.setup();
            const mockOnSend = vi.fn().mockResolvedValue(undefined);

            render(<MessageInput onSend={mockOnSend} defaultAuthor="User" />);

            // Fill in valid message
            const textarea = screen.getByLabelText(/^message$/i);
            await user.type(textarea, 'Test message');

            // Focus and activate send button with Enter
            const sendButton = screen.getByRole('button', { name: /send/i });
            sendButton.focus();
            await user.keyboard('{Enter}');

            expect(mockOnSend).toHaveBeenCalledWith('Test message', 'User');
        });

        it('should activate send button with Space key when focused', async () => {
            const user = userEvent.setup();
            const mockOnSend = vi.fn().mockResolvedValue(undefined);

            render(<MessageInput onSend={mockOnSend} defaultAuthor="User" />);

            // Fill in valid message
            const textarea = screen.getByLabelText(/^message$/i);
            await user.type(textarea, 'Test message');

            // Focus and activate send button with Space
            const sendButton = screen.getByRole('button', { name: /send/i });
            sendButton.focus();
            await user.keyboard(' ');

            expect(mockOnSend).toHaveBeenCalledWith('Test message', 'User');
        });

        it('should activate retry button with Enter key when focused', async () => {
            const user = userEvent.setup();
            const mockRetry = vi.fn();

            render(<ErrorBanner message="Test error" onRetry={mockRetry} />);

            const retryButton = screen.getByRole('button', { name: /retry/i });
            retryButton.focus();
            await user.keyboard('{Enter}');

            expect(mockRetry).toHaveBeenCalledTimes(1);
        });

        it('should activate retry button with Space key when focused', async () => {
            const user = userEvent.setup();
            const mockRetry = vi.fn();

            render(<ErrorBanner message="Test error" onRetry={mockRetry} />);

            const retryButton = screen.getByRole('button', { name: /retry/i });
            retryButton.focus();
            await user.keyboard(' ');

            expect(mockRetry).toHaveBeenCalledTimes(1);
        });

        it('should activate load more button with Enter key when focused', async () => {
            const user = userEvent.setup();
            const mockLoadMore = vi.fn();
            const messages: Message[] = [{
                id: '1',
                message: 'Test',
                author: 'User',
                timestamp: new Date().toISOString()
            }];

            render(
                <MessageList
                    messages={messages}
                    isLoading={false}
                    hasMore={true}
                    onLoadMore={mockLoadMore}
                />
            );

            const loadMoreButton = screen.getByRole('button', { name: /load older messages/i });
            loadMoreButton.focus();
            await user.keyboard('{Enter}');

            expect(mockLoadMore).toHaveBeenCalledTimes(1);
        });

        it('should activate load more button with Space key when focused', async () => {
            const user = userEvent.setup();
            const mockLoadMore = vi.fn();
            const messages: Message[] = [{
                id: '1',
                message: 'Test',
                author: 'User',
                timestamp: new Date().toISOString()
            }];

            render(
                <MessageList
                    messages={messages}
                    isLoading={false}
                    hasMore={true}
                    onLoadMore={mockLoadMore}
                />
            );

            const loadMoreButton = screen.getByRole('button', { name: /load older messages/i });
            loadMoreButton.focus();
            await user.keyboard(' ');

            expect(mockLoadMore).toHaveBeenCalledTimes(1);
        });
    });

    describe('Focus Management', () => {
        it('should maintain focus on textarea after typing', async () => {
            const user = userEvent.setup();
            const mockOnSend = vi.fn().mockResolvedValue(undefined);

            render(<MessageInput onSend={mockOnSend} />);

            const textarea = screen.getByLabelText(/^message$/i);
            await user.type(textarea, 'Hello world');

            expect(document.activeElement).toBe(textarea);
        });

        it('should maintain focus on author input after typing', async () => {
            const user = userEvent.setup();
            const mockOnSend = vi.fn().mockResolvedValue(undefined);

            render(<MessageInput onSend={mockOnSend} />);

            const input = screen.getByLabelText(/your name/i);
            await user.type(input, 'John Doe');

            expect(document.activeElement).toBe(input);
        });
    });
});
