import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MessageInput from './MessageInput';

describe('MessageInput', () => {
    const mockOnSend = vi.fn().mockResolvedValue(undefined);

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('rendering', () => {
        it('renders a textarea for message body', () => {
            render(<MessageInput onSend={mockOnSend} />);

            const textarea = screen.getByRole('textbox', { name: /message/i });
            expect(textarea).toBeInTheDocument();
            expect(textarea.tagName).toBe('TEXTAREA');
        });

        it('renders a text input for author name', () => {
            render(<MessageInput onSend={mockOnSend} />);

            const input = screen.getByRole('textbox', { name: /your name/i });
            expect(input).toBeInTheDocument();
            expect(input.tagName).toBe('INPUT');
        });

        it('renders a send button', () => {
            render(<MessageInput onSend={mockOnSend} />);

            const button = screen.getByRole('button', { name: /send/i });
            expect(button).toBeInTheDocument();
        });

        it('renders with placeholder text', () => {
            render(<MessageInput onSend={mockOnSend} />);

            expect(screen.getByPlaceholderText(/type your message/i)).toBeInTheDocument();
            expect(screen.getByPlaceholderText(/enter your name/i)).toBeInTheDocument();
        });
    });

    describe('labels and accessibility', () => {
        it('has a label for the message textarea', () => {
            render(<MessageInput onSend={mockOnSend} />);

            const textarea = screen.getByLabelText(/^message$/i);
            expect(textarea).toBeInTheDocument();
        });

        it('has a label for the author input', () => {
            render(<MessageInput onSend={mockOnSend} />);

            const input = screen.getByLabelText(/your name/i);
            expect(input).toBeInTheDocument();
        });

        it('has an accessible name on the send button', () => {
            render(<MessageInput onSend={mockOnSend} />);

            const button = screen.getByRole('button', { name: /send message/i });
            expect(button).toBeInTheDocument();
        });

        it('uses a form element for semantic structure', () => {
            const { container } = render(<MessageInput onSend={mockOnSend} />);

            const form = container.querySelector('form');
            expect(form).toBeInTheDocument();
        });
    });

    describe('defaultAuthor prop', () => {
        it('pre-fills the author field with defaultAuthor', () => {
            render(<MessageInput onSend={mockOnSend} defaultAuthor="John Doe" />);

            const input = screen.getByLabelText(/your name/i);
            expect(input).toHaveValue('John Doe');
        });

        it('allows editing the pre-filled author', async () => {
            const user = userEvent.setup();
            render(<MessageInput onSend={mockOnSend} defaultAuthor="John" />);

            const input = screen.getByLabelText(/your name/i);
            await user.clear(input);
            await user.type(input, 'Jane');

            expect(input).toHaveValue('Jane');
        });
    });

    describe('disabled state', () => {
        it('disables the message textarea when disabled is true', () => {
            render(<MessageInput onSend={mockOnSend} disabled={true} />);

            const textarea = screen.getByLabelText(/^message$/i);
            expect(textarea).toBeDisabled();
        });

        it('disables the author input when disabled is true', () => {
            render(<MessageInput onSend={mockOnSend} disabled={true} />);

            const input = screen.getByLabelText(/your name/i);
            expect(input).toBeDisabled();
        });

        it('disables the send button when disabled is true', async () => {
            const user = userEvent.setup();
            render(<MessageInput onSend={mockOnSend} disabled={true} />);

            // Fill in valid input first
            await user.type(screen.getByLabelText(/^message$/i), 'Hello');
            await user.type(screen.getByLabelText(/your name/i), 'User');

            const button = screen.getByRole('button', { name: /send/i });
            expect(button).toBeDisabled();
        });

        it('enables inputs when disabled is false and input is valid', async () => {
            const user = userEvent.setup();
            render(<MessageInput onSend={mockOnSend} disabled={false} />);

            await user.type(screen.getByLabelText(/^message$/i), 'Hello');
            await user.type(screen.getByLabelText(/your name/i), 'User');

            expect(screen.getByLabelText(/^message$/i)).not.toBeDisabled();
            expect(screen.getByLabelText(/your name/i)).not.toBeDisabled();
            expect(screen.getByRole('button', { name: /send/i })).not.toBeDisabled();
        });

        it('enables text inputs by default', () => {
            render(<MessageInput onSend={mockOnSend} />);

            expect(screen.getByLabelText(/^message$/i)).not.toBeDisabled();
            expect(screen.getByLabelText(/your name/i)).not.toBeDisabled();
        });
    });

    describe('user input', () => {
        it('updates message value when typing', async () => {
            const user = userEvent.setup();
            render(<MessageInput onSend={mockOnSend} />);

            const textarea = screen.getByLabelText(/^message$/i);
            await user.type(textarea, 'Hello, world!');

            expect(textarea).toHaveValue('Hello, world!');
        });

        it('updates author value when typing', async () => {
            const user = userEvent.setup();
            render(<MessageInput onSend={mockOnSend} />);

            const input = screen.getByLabelText(/your name/i);
            await user.type(input, 'Alice');

            expect(input).toHaveValue('Alice');
        });
    });

    describe('input validation', () => {
        it('disables send button when message is empty', () => {
            render(<MessageInput onSend={mockOnSend} defaultAuthor="User" />);

            const button = screen.getByRole('button', { name: /send/i });
            expect(button).toBeDisabled();
        });

        it('disables send button when message contains only whitespace', async () => {
            const user = userEvent.setup();
            render(<MessageInput onSend={mockOnSend} defaultAuthor="User" />);

            await user.type(screen.getByLabelText(/^message$/i), '   ');

            const button = screen.getByRole('button', { name: /send/i });
            expect(button).toBeDisabled();
        });

        it('disables send button when author is empty', async () => {
            const user = userEvent.setup();
            render(<MessageInput onSend={mockOnSend} />);

            await user.type(screen.getByLabelText(/^message$/i), 'Hello');

            const button = screen.getByRole('button', { name: /send/i });
            expect(button).toBeDisabled();
        });

        it('disables send button when author contains only whitespace', async () => {
            const user = userEvent.setup();
            render(<MessageInput onSend={mockOnSend} />);

            await user.type(screen.getByLabelText(/^message$/i), 'Hello');
            await user.type(screen.getByLabelText(/your name/i), '   ');

            const button = screen.getByRole('button', { name: /send/i });
            expect(button).toBeDisabled();
        });

        it('enables send button when both message and author have content', async () => {
            const user = userEvent.setup();
            render(<MessageInput onSend={mockOnSend} />);

            await user.type(screen.getByLabelText(/^message$/i), 'Hello');
            await user.type(screen.getByLabelText(/your name/i), 'User');

            const button = screen.getByRole('button', { name: /send/i });
            expect(button).not.toBeDisabled();
        });

        it('prevents submission when message is empty', async () => {
            const user = userEvent.setup();
            render(<MessageInput onSend={mockOnSend} defaultAuthor="User" />);

            // Try to submit with empty message
            await user.click(screen.getByRole('button', { name: /send/i }));

            expect(mockOnSend).not.toHaveBeenCalled();
        });

        it('prevents submission when author is empty', async () => {
            const user = userEvent.setup();
            render(<MessageInput onSend={mockOnSend} />);

            await user.type(screen.getByLabelText(/^message$/i), 'Hello');
            // Try to submit with empty author
            await user.click(screen.getByRole('button', { name: /send/i }));

            expect(mockOnSend).not.toHaveBeenCalled();
        });

        it('trims whitespace from message before sending', async () => {
            const user = userEvent.setup();
            render(<MessageInput onSend={mockOnSend} defaultAuthor="User" />);

            await user.type(screen.getByLabelText(/^message$/i), '  Hello World  ');
            await user.click(screen.getByRole('button', { name: /send/i }));

            expect(mockOnSend).toHaveBeenCalledWith('Hello World', 'User');
        });

        it('trims whitespace from author before sending', async () => {
            const user = userEvent.setup();
            render(<MessageInput onSend={mockOnSend} />);

            await user.type(screen.getByLabelText(/^message$/i), 'Hello');
            await user.type(screen.getByLabelText(/your name/i), '  John Doe  ');
            await user.click(screen.getByRole('button', { name: /send/i }));

            expect(mockOnSend).toHaveBeenCalledWith('Hello', 'John Doe');
        });

        it('trims whitespace from both message and author before sending', async () => {
            const user = userEvent.setup();
            render(<MessageInput onSend={mockOnSend} />);

            await user.type(screen.getByLabelText(/^message$/i), '  Test message  ');
            await user.type(screen.getByLabelText(/your name/i), '  Test Author  ');
            await user.click(screen.getByRole('button', { name: /send/i }));

            expect(mockOnSend).toHaveBeenCalledWith('Test message', 'Test Author');
        });
    });

    describe('form submission', () => {
        it('calls onSend with message and author when form is submitted', async () => {
            const user = userEvent.setup();
            render(<MessageInput onSend={mockOnSend} />);

            await user.type(screen.getByLabelText(/^message$/i), 'Test message');
            await user.type(screen.getByLabelText(/your name/i), 'Test Author');
            await user.click(screen.getByRole('button', { name: /send/i }));

            expect(mockOnSend).toHaveBeenCalledTimes(1);
            expect(mockOnSend).toHaveBeenCalledWith('Test message', 'Test Author');
        });

        it('calls onSend with defaultAuthor when author is not changed', async () => {
            const user = userEvent.setup();
            render(<MessageInput onSend={mockOnSend} defaultAuthor="Default User" />);

            await user.type(screen.getByLabelText(/^message$/i), 'Hello');
            await user.click(screen.getByRole('button', { name: /send/i }));

            expect(mockOnSend).toHaveBeenCalledWith('Hello', 'Default User');
        });
    });

    describe('edge cases', () => {
        it('handles special characters in message', async () => {
            const user = userEvent.setup();
            render(<MessageInput onSend={mockOnSend} />);

            const specialMessage = 'Hello! @#$%^&*() <script>test</script>';
            await user.type(screen.getByLabelText(/^message$/i), specialMessage);
            await user.type(screen.getByLabelText(/your name/i), 'User');
            await user.click(screen.getByRole('button', { name: /send/i }));

            expect(mockOnSend).toHaveBeenCalledWith(specialMessage, 'User');
        });

        it('handles special characters in author name', async () => {
            const user = userEvent.setup();
            render(<MessageInput onSend={mockOnSend} />);

            await user.type(screen.getByLabelText(/^message$/i), 'Hello');
            await user.type(screen.getByLabelText(/your name/i), 'José García');
            await user.click(screen.getByRole('button', { name: /send/i }));

            expect(mockOnSend).toHaveBeenCalledWith('Hello', 'José García');
        });

        it('handles empty defaultAuthor', () => {
            render(<MessageInput onSend={mockOnSend} defaultAuthor="" />);

            const input = screen.getByLabelText(/your name/i);
            expect(input).toHaveValue('');
        });
    });
});
