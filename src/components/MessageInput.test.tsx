import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as fc from 'fast-check';
import MessageInput from './MessageInput';

const AUTHOR_STORAGE_KEY = 'chat_author_name';

describe('MessageInput', () => {
    const mockOnSend = vi.fn().mockResolvedValue(undefined);

    beforeEach(() => {
        vi.clearAllMocks();
        // Clear localStorage before each test to ensure clean state
        localStorage.removeItem(AUTHOR_STORAGE_KEY);
    });

    afterEach(() => {
        localStorage.removeItem(AUTHOR_STORAGE_KEY);
    });

    describe('rendering', () => {
        it('renders a textarea for message body', () => {
            render(<MessageInput onSend={mockOnSend} />);
            const textarea = screen.getByRole('textbox', { name: /message/i });
            expect(textarea).toBeInTheDocument();
            expect(textarea.tagName).toBe('TEXTAREA');
        });

        it('renders a text input for author name when not saved', () => {
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
            expect(screen.getByPlaceholderText(/type a message/i)).toBeInTheDocument();
            expect(screen.getByPlaceholderText(/your name/i)).toBeInTheDocument();
        });

        it('shows author badge instead of input when author is saved in localStorage', () => {
            localStorage.setItem(AUTHOR_STORAGE_KEY, 'Saved User');
            render(<MessageInput onSend={mockOnSend} />);
            expect(screen.getByText('Saved User')).toBeInTheDocument();
            expect(screen.queryByRole('textbox', { name: /your name/i })).not.toBeInTheDocument();
        });
    });

    describe('labels and accessibility', () => {
        it('has aria-label for the message textarea', () => {
            render(<MessageInput onSend={mockOnSend} />);
            const textarea = screen.getByLabelText(/^message$/i);
            expect(textarea).toBeInTheDocument();
        });

        it('has aria-label for the author input', () => {
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

        it('has aria-label attribute on send button', () => {
            render(<MessageInput onSend={mockOnSend} />);
            const button = screen.getByRole('button', { name: /send/i });
            expect(button).toHaveAttribute('aria-label', 'Send message');
        });

        it('has edit button with accessible name when author is saved', () => {
            localStorage.setItem(AUTHOR_STORAGE_KEY, 'Test User');
            render(<MessageInput onSend={mockOnSend} />);
            const editButton = screen.getByRole('button', { name: /change name/i });
            expect(editButton).toBeInTheDocument();
        });
    });

    describe('defaultAuthor prop', () => {
        it('pre-fills the author field with defaultAuthor when localStorage is empty', () => {
            render(<MessageInput onSend={mockOnSend} defaultAuthor="John Doe" />);
            const input = screen.getByLabelText(/your name/i);
            expect(input).toHaveValue('John Doe');
        });

        it('prefers localStorage over defaultAuthor', () => {
            localStorage.setItem(AUTHOR_STORAGE_KEY, 'Saved User');
            render(<MessageInput onSend={mockOnSend} defaultAuthor="Default User" />);
            expect(screen.getByText('Saved User')).toBeInTheDocument();
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
            await user.click(screen.getByRole('button', { name: /send/i }));
            expect(mockOnSend).not.toHaveBeenCalled();
        });

        it('prevents submission when author is empty', async () => {
            const user = userEvent.setup();
            render(<MessageInput onSend={mockOnSend} />);
            await user.type(screen.getByLabelText(/^message$/i), 'Hello');
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

        it('saves author to localStorage after first send', async () => {
            const user = userEvent.setup();
            render(<MessageInput onSend={mockOnSend} />);
            await user.type(screen.getByLabelText(/^message$/i), 'Hello');
            await user.type(screen.getByLabelText(/your name/i), 'New User');
            await user.click(screen.getByRole('button', { name: /send/i }));
            expect(localStorage.getItem(AUTHOR_STORAGE_KEY)).toBe('New User');
        });

        it('hides author input after first send', async () => {
            const user = userEvent.setup();
            render(<MessageInput onSend={mockOnSend} />);
            await user.type(screen.getByLabelText(/^message$/i), 'Hello');
            await user.type(screen.getByLabelText(/your name/i), 'New User');
            await user.click(screen.getByRole('button', { name: /send/i }));
            expect(screen.queryByRole('textbox', { name: /your name/i })).not.toBeInTheDocument();
            expect(screen.getByText('New User')).toBeInTheDocument();
        });

        it('clears message after send', async () => {
            const user = userEvent.setup();
            render(<MessageInput onSend={mockOnSend} defaultAuthor="User" />);
            await user.type(screen.getByLabelText(/^message$/i), 'Hello');
            await user.click(screen.getByRole('button', { name: /send/i }));
            expect(screen.getByLabelText(/^message$/i)).toHaveValue('');
        });
    });

    describe('edit author functionality', () => {
        it('shows author input when edit button is clicked', async () => {
            const user = userEvent.setup();
            localStorage.setItem(AUTHOR_STORAGE_KEY, 'Saved User');
            render(<MessageInput onSend={mockOnSend} />);
            expect(screen.queryByRole('textbox', { name: /your name/i })).not.toBeInTheDocument();
            await user.click(screen.getByRole('button', { name: /change name/i }));
            expect(screen.getByRole('textbox', { name: /your name/i })).toBeInTheDocument();
        });

        it('preserves author value when switching to edit mode', async () => {
            const user = userEvent.setup();
            localStorage.setItem(AUTHOR_STORAGE_KEY, 'Saved User');
            render(<MessageInput onSend={mockOnSend} />);
            await user.click(screen.getByRole('button', { name: /change name/i }));
            expect(screen.getByLabelText(/your name/i)).toHaveValue('Saved User');
        });
    });

    describe('keyboard handling', () => {
        it('submits message when Enter is pressed with valid input', async () => {
            const user = userEvent.setup();
            render(<MessageInput onSend={mockOnSend} />);
            await user.type(screen.getByLabelText(/^message$/i), 'Hello');
            await user.type(screen.getByLabelText(/your name/i), 'User');
            await user.type(screen.getByLabelText(/^message$/i), '{Enter}');
            expect(mockOnSend).toHaveBeenCalledTimes(1);
            expect(mockOnSend).toHaveBeenCalledWith('Hello', 'User');
        });

        it('does not submit when Enter is pressed with invalid input (empty message)', async () => {
            const user = userEvent.setup();
            render(<MessageInput onSend={mockOnSend} defaultAuthor="User" />);
            await user.type(screen.getByLabelText(/^message$/i), '{Enter}');
            expect(mockOnSend).not.toHaveBeenCalled();
        });

        it('does not submit when Enter is pressed with invalid input (empty author)', async () => {
            const user = userEvent.setup();
            render(<MessageInput onSend={mockOnSend} />);
            await user.type(screen.getByLabelText(/^message$/i), 'Hello');
            await user.type(screen.getByLabelText(/^message$/i), '{Enter}');
            expect(mockOnSend).not.toHaveBeenCalled();
        });

        it('inserts newline when Shift+Enter is pressed', async () => {
            const user = userEvent.setup();
            render(<MessageInput onSend={mockOnSend} defaultAuthor="User" />);
            const textarea = screen.getByLabelText(/^message$/i);
            await user.type(textarea, 'Line 1{Shift>}{Enter}{/Shift}Line 2');
            expect(textarea).toHaveValue('Line 1\nLine 2');
            expect(mockOnSend).not.toHaveBeenCalled();
        });

        it('does not submit when Shift+Enter is pressed with valid input', async () => {
            const user = userEvent.setup();
            render(<MessageInput onSend={mockOnSend} defaultAuthor="User" />);
            await user.type(screen.getByLabelText(/^message$/i), 'Hello');
            await user.type(screen.getByLabelText(/^message$/i), '{Shift>}{Enter}{/Shift}');
            expect(mockOnSend).not.toHaveBeenCalled();
        });

        it('does not submit when Enter is pressed while disabled', async () => {
            render(<MessageInput onSend={mockOnSend} disabled={true} defaultAuthor="User" />);
            expect(mockOnSend).not.toHaveBeenCalled();
        });

        it('trims whitespace when submitting via Enter key', async () => {
            const user = userEvent.setup();
            render(<MessageInput onSend={mockOnSend} defaultAuthor="  User  " />);
            await user.type(screen.getByLabelText(/^message$/i), '  Hello World  ');
            await user.type(screen.getByLabelText(/^message$/i), '{Enter}');
            expect(mockOnSend).toHaveBeenCalledWith('Hello World', 'User');
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


/**
 * Property-Based Tests
 * Feature: chat-application, Property 7: Whitespace Validation Disables Send
 * **Validates: Requirements 5.1, 5.2, 4.10**
 */
describe('Property-Based Tests', () => {
    const AUTHOR_STORAGE_KEY = 'chat_author_name';

    beforeEach(() => {
        localStorage.removeItem(AUTHOR_STORAGE_KEY);
    });

    afterEach(() => {
        localStorage.removeItem(AUTHOR_STORAGE_KEY);
    });

    describe('Property 7: Whitespace Validation Disables Send', () => {
        const whitespaceChars = [' ', '\t', '\n', '\r'];
        const whitespaceOnlyArb = fc.array(
            fc.constantFrom(...whitespaceChars),
            { minLength: 0, maxLength: 20 }
        ).map(chars => chars.join(''));
        const nonWhitespaceArb = fc.string({ minLength: 1, maxLength: 50 })
            .filter(s => s.trim().length > 0);

        const testValidationState = (
            messageValue: string,
            authorValue: string,
            expectedDisabled: boolean
        ): boolean => {
            const mockOnSend = vi.fn().mockResolvedValue(undefined);
            const { unmount, container } = render(
                <MessageInput onSend={mockOnSend} defaultAuthor={authorValue} />
            );
            try {
                const textarea = container.querySelector('textarea');
                if (textarea) {
                    Object.getOwnPropertyDescriptor(
                        window.HTMLTextAreaElement.prototype,
                        'value'
                    )?.set?.call(textarea, messageValue);
                    textarea.dispatchEvent(new Event('input', { bubbles: true }));
                }
                const button = container.querySelector('button[type="submit"]');
                const isDisabled = button?.hasAttribute('disabled') ?? false;
                return isDisabled === expectedDisabled;
            } finally {
                unmount();
            }
        };

        it('disables send button when message is whitespace-only', () => {
            fc.assert(
                fc.property(whitespaceOnlyArb, nonWhitespaceArb, (whitespaceMessage, validAuthor) => {
                    return testValidationState(whitespaceMessage, validAuthor, true);
                }),
                { numRuns: 20 }
            );
        });

        it('disables send button when author is whitespace-only', () => {
            fc.assert(
                fc.property(nonWhitespaceArb, whitespaceOnlyArb, (validMessage, whitespaceAuthor) => {
                    return testValidationState(validMessage, whitespaceAuthor, true);
                }),
                { numRuns: 20 }
            );
        });

        it('enables send button when both have non-whitespace content', () => {
            fc.assert(
                fc.property(nonWhitespaceArb, nonWhitespaceArb, (validMessage, validAuthor) => {
                    return testValidationState(validMessage, validAuthor, false);
                }),
                { numRuns: 20 }
            );
        });
    });
});


/**
 * Property-Based Tests
 * Feature: chat-application, Property 8: Whitespace Trimming Before Send
 * **Validates: Requirements 5.3, 5.4**
 */
describe('Property 8: Whitespace Trimming Before Send', () => {
    const AUTHOR_STORAGE_KEY = 'chat_author_name';

    beforeEach(() => {
        localStorage.removeItem(AUTHOR_STORAGE_KEY);
    });

    afterEach(() => {
        localStorage.removeItem(AUTHOR_STORAGE_KEY);
    });

    const whitespaceChars = [' ', '\t', '\n', '\r'];
    const whitespacePaddingArb = fc.array(
        fc.constantFrom(...whitespaceChars),
        { minLength: 1, maxLength: 10 }
    ).map(chars => chars.join(''));
    const nonEmptyContentArb = fc.string({ minLength: 1, maxLength: 30 })
        .filter(s => s.trim().length > 0);

    it('trims leading whitespace from message before sending', async () => {
        await fc.assert(
            fc.asyncProperty(
                whitespacePaddingArb,
                nonEmptyContentArb,
                nonEmptyContentArb,
                async (leadingWs, messageContent, authorContent) => {
                    const mockOnSend = vi.fn().mockResolvedValue(undefined);
                    const messageWithLeadingWs = `${leadingWs}${messageContent}`;
                    const { unmount, container } = render(
                        <MessageInput onSend={mockOnSend} defaultAuthor={authorContent} />
                    );
                    try {
                        const textarea = container.querySelector('textarea');
                        if (textarea) {
                            Object.getOwnPropertyDescriptor(
                                window.HTMLTextAreaElement.prototype,
                                'value'
                            )?.set?.call(textarea, messageWithLeadingWs);
                            textarea.dispatchEvent(new Event('input', { bubbles: true }));
                        }
                        const form = container.querySelector('form');
                        form?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
                        await vi.waitFor(() => {
                            expect(mockOnSend).toHaveBeenCalled();
                        });
                        const [sentMessage] = mockOnSend.mock.calls[0];
                        return sentMessage === messageContent.trim();
                    } finally {
                        unmount();
                    }
                }
            ),
            { numRuns: 20 }
        );
    });

    it('trims trailing whitespace from message before sending', async () => {
        await fc.assert(
            fc.asyncProperty(
                whitespacePaddingArb,
                nonEmptyContentArb,
                nonEmptyContentArb,
                async (trailingWs, messageContent, authorContent) => {
                    const mockOnSend = vi.fn().mockResolvedValue(undefined);
                    const messageWithTrailingWs = `${messageContent}${trailingWs}`;
                    const { unmount, container } = render(
                        <MessageInput onSend={mockOnSend} defaultAuthor={authorContent} />
                    );
                    try {
                        const textarea = container.querySelector('textarea');
                        if (textarea) {
                            Object.getOwnPropertyDescriptor(
                                window.HTMLTextAreaElement.prototype,
                                'value'
                            )?.set?.call(textarea, messageWithTrailingWs);
                            textarea.dispatchEvent(new Event('input', { bubbles: true }));
                        }
                        const form = container.querySelector('form');
                        form?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
                        await vi.waitFor(() => {
                            expect(mockOnSend).toHaveBeenCalled();
                        });
                        const [sentMessage] = mockOnSend.mock.calls[0];
                        return sentMessage === messageContent.trim();
                    } finally {
                        unmount();
                    }
                }
            ),
            { numRuns: 20 }
        );
    });
});


/**
 * Property-Based Tests
 * Feature: chat-application, Property 11: Enter Key Submits Message
 * **Validates: Requirements 8.2**
 */
describe('Property 11: Enter Key Submits Message', () => {
    const AUTHOR_STORAGE_KEY = 'chat_author_name';

    beforeEach(() => {
        localStorage.removeItem(AUTHOR_STORAGE_KEY);
    });

    afterEach(() => {
        localStorage.removeItem(AUTHOR_STORAGE_KEY);
    });

    const validInputArb = fc.string({ minLength: 1, maxLength: 50 })
        .filter(s => s.trim().length > 0);

    it('submits message when form is submitted with valid input', async () => {
        await fc.assert(
            fc.asyncProperty(
                validInputArb,
                validInputArb,
                async (validMessage, validAuthor) => {
                    const mockOnSend = vi.fn().mockResolvedValue(undefined);
                    // Pre-save author to localStorage so it's used directly
                    localStorage.setItem(AUTHOR_STORAGE_KEY, validAuthor);
                    const { unmount, container } = render(
                        <MessageInput onSend={mockOnSend} />
                    );
                    try {
                        // Set message value
                        const textarea = container.querySelector('textarea');
                        if (!textarea) return false;
                        Object.getOwnPropertyDescriptor(
                            window.HTMLTextAreaElement.prototype,
                            'value'
                        )?.set?.call(textarea, validMessage);
                        textarea.dispatchEvent(new Event('input', { bubbles: true }));

                        // Submit via form
                        const form = container.querySelector('form');
                        form?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
                        await vi.waitFor(() => {
                            expect(mockOnSend).toHaveBeenCalled();
                        });
                        const [sentMessage, sentAuthor] = mockOnSend.mock.calls[0];
                        return sentMessage === validMessage.trim() && sentAuthor === validAuthor.trim();
                    } finally {
                        unmount();
                        localStorage.removeItem(AUTHOR_STORAGE_KEY);
                    }
                }
            ),
            { numRuns: 20 }
        );
    });

    it('does not submit when Shift+Enter is pressed', async () => {
        await fc.assert(
            fc.asyncProperty(
                validInputArb,
                validInputArb,
                async (validMessage, validAuthor) => {
                    const mockOnSend = vi.fn().mockResolvedValue(undefined);
                    const { unmount, container } = render(
                        <MessageInput onSend={mockOnSend} defaultAuthor={validAuthor} />
                    );
                    try {
                        const textarea = container.querySelector('textarea');
                        if (!textarea) return false;
                        Object.getOwnPropertyDescriptor(
                            window.HTMLTextAreaElement.prototype,
                            'value'
                        )?.set?.call(textarea, validMessage);
                        textarea.dispatchEvent(new Event('input', { bubbles: true }));
                        const shiftEnterEvent = new KeyboardEvent('keydown', {
                            key: 'Enter',
                            code: 'Enter',
                            shiftKey: true,
                            bubbles: true,
                            cancelable: true
                        });
                        textarea.dispatchEvent(shiftEnterEvent);
                        await new Promise(resolve => setTimeout(resolve, 10));
                        return mockOnSend.mock.calls.length === 0;
                    } finally {
                        unmount();
                    }
                }
            ),
            { numRuns: 20 }
        );
    });
});

/**
 * Property-Based Tests
 * Feature: chat-application, Property 12: Shift+Enter Inserts Newline
 * **Validates: Requirements 8.3**
 */
describe('Property 12: Shift+Enter Inserts Newline', () => {
    const AUTHOR_STORAGE_KEY = 'chat_author_name';

    beforeEach(() => {
        localStorage.removeItem(AUTHOR_STORAGE_KEY);
    });

    afterEach(() => {
        localStorage.removeItem(AUTHOR_STORAGE_KEY);
    });

    const anyStringArb = fc.string({ minLength: 0, maxLength: 50 });

    it('allows default browser behavior for newline insertion', async () => {
        await fc.assert(
            fc.asyncProperty(
                anyStringArb,
                anyStringArb,
                async (message, author) => {
                    const mockOnSend = vi.fn().mockResolvedValue(undefined);
                    const { unmount, container } = render(
                        <MessageInput onSend={mockOnSend} defaultAuthor={author} />
                    );
                    try {
                        const textarea = container.querySelector('textarea');
                        if (!textarea) return false;
                        if (message) {
                            Object.getOwnPropertyDescriptor(
                                window.HTMLTextAreaElement.prototype,
                                'value'
                            )?.set?.call(textarea, message);
                            textarea.dispatchEvent(new Event('input', { bubbles: true }));
                        }
                        let preventDefaultCalled = false;
                        const shiftEnterEvent = new KeyboardEvent('keydown', {
                            key: 'Enter',
                            code: 'Enter',
                            shiftKey: true,
                            bubbles: true,
                            cancelable: true
                        });
                        const originalPreventDefault = shiftEnterEvent.preventDefault.bind(shiftEnterEvent);
                        shiftEnterEvent.preventDefault = () => {
                            preventDefaultCalled = true;
                            originalPreventDefault();
                        };
                        textarea.dispatchEvent(shiftEnterEvent);
                        return !preventDefaultCalled && mockOnSend.mock.calls.length === 0;
                    } finally {
                        unmount();
                    }
                }
            ),
            { numRuns: 20 }
        );
    });
});
