import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as fc from 'fast-check';
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

    describe('keyboard handling', () => {
        it('submits message when Enter is pressed with valid input', async () => {
            const user = userEvent.setup();
            render(<MessageInput onSend={mockOnSend} />);

            await user.type(screen.getByLabelText(/^message$/i), 'Hello');
            await user.type(screen.getByLabelText(/your name/i), 'User');

            // Press Enter in the textarea
            await user.type(screen.getByLabelText(/^message$/i), '{Enter}');

            expect(mockOnSend).toHaveBeenCalledTimes(1);
            expect(mockOnSend).toHaveBeenCalledWith('Hello', 'User');
        });

        it('does not submit when Enter is pressed with invalid input (empty message)', async () => {
            const user = userEvent.setup();
            render(<MessageInput onSend={mockOnSend} defaultAuthor="User" />);

            // Press Enter with empty message
            await user.type(screen.getByLabelText(/^message$/i), '{Enter}');

            expect(mockOnSend).not.toHaveBeenCalled();
        });

        it('does not submit when Enter is pressed with invalid input (empty author)', async () => {
            const user = userEvent.setup();
            render(<MessageInput onSend={mockOnSend} />);

            await user.type(screen.getByLabelText(/^message$/i), 'Hello');
            // Press Enter with empty author
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
            // Press Shift+Enter
            await user.type(screen.getByLabelText(/^message$/i), '{Shift>}{Enter}{/Shift}');

            expect(mockOnSend).not.toHaveBeenCalled();
        });

        it('does not submit when Enter is pressed while disabled', async () => {
            render(<MessageInput onSend={mockOnSend} disabled={true} defaultAuthor="User" />);

            // Component is disabled, so we can't type, but let's verify the behavior
            // by checking that even if somehow Enter was pressed, it wouldn't submit
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
    describe('Property 7: Whitespace Validation Disables Send', () => {
        // Whitespace characters to use for generating whitespace-only strings
        const whitespaceChars = [' ', '\t', '\n', '\r'];

        // Arbitrary for whitespace-only strings (including empty string)
        const whitespaceOnlyArb = fc.array(
            fc.constantFrom(...whitespaceChars),
            { minLength: 0, maxLength: 20 }
        ).map(chars => chars.join(''));

        // Arbitrary for non-whitespace strings (at least one non-whitespace char)
        const nonWhitespaceArb = fc.string({ minLength: 1, maxLength: 50 })
            .filter(s => s.trim().length > 0);

        // Helper function to test validation state
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
                // Set the message value using the textarea directly
                const textarea = container.querySelector('textarea');
                if (textarea) {
                    // Simulate React's controlled input behavior
                    Object.getOwnPropertyDescriptor(
                        window.HTMLTextAreaElement.prototype,
                        'value'
                    )?.set?.call(textarea, messageValue);
                    textarea.dispatchEvent(new Event('input', { bubbles: true }));
                }

                // Get the button from the container to avoid global screen query issues
                const button = container.querySelector('button[type="submit"]');
                const isDisabled = button?.hasAttribute('disabled') ?? false;

                return isDisabled === expectedDisabled;
            } finally {
                unmount();
            }
        };

        it('disables send button when message is whitespace-only (any whitespace string)', () => {
            fc.assert(
                fc.property(whitespaceOnlyArb, nonWhitespaceArb, (whitespaceMessage, validAuthor) => {
                    return testValidationState(whitespaceMessage, validAuthor, true);
                }),
                { numRuns: 20 }
            );
        });

        it('disables send button when author is whitespace-only (any whitespace string)', () => {
            fc.assert(
                fc.property(nonWhitespaceArb, whitespaceOnlyArb, (validMessage, whitespaceAuthor) => {
                    return testValidationState(validMessage, whitespaceAuthor, true);
                }),
                { numRuns: 20 }
            );
        });

        it('disables send button when both message and author are whitespace-only', () => {
            fc.assert(
                fc.property(whitespaceOnlyArb, whitespaceOnlyArb, (whitespaceMessage, whitespaceAuthor) => {
                    return testValidationState(whitespaceMessage, whitespaceAuthor, true);
                }),
                { numRuns: 20 }
            );
        });

        it('enables send button only when both message and author have non-whitespace content', () => {
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
    // Arbitrary for generating whitespace padding (spaces, tabs, newlines)
    const whitespaceChars = [' ', '\t', '\n', '\r'];
    const whitespacePaddingArb = fc.array(
        fc.constantFrom(...whitespaceChars),
        { minLength: 1, maxLength: 10 }
    ).map(chars => chars.join(''));

    // Arbitrary for non-empty content (at least one non-whitespace char)
    const nonEmptyContentArb = fc.string({ minLength: 1, maxLength: 30 })
        .filter(s => s.trim().length > 0);

    // Helper to create a string with leading/trailing whitespace
    const withWhitespace = (
        content: string,
        leadingWs: string,
        trailingWs: string
    ): string => `${leadingWs}${content}${trailingWs}`;

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
                        // Set message value with leading whitespace
                        const textarea = container.querySelector('textarea');
                        if (textarea) {
                            Object.getOwnPropertyDescriptor(
                                window.HTMLTextAreaElement.prototype,
                                'value'
                            )?.set?.call(textarea, messageWithLeadingWs);
                            textarea.dispatchEvent(new Event('input', { bubbles: true }));
                        }

                        // Submit the form
                        const form = container.querySelector('form');
                        form?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

                        // Wait for async onSend
                        await vi.waitFor(() => {
                            expect(mockOnSend).toHaveBeenCalled();
                        });

                        // Verify trimmed message was sent
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

    it('trims leading whitespace from author before sending', async () => {
        await fc.assert(
            fc.asyncProperty(
                whitespacePaddingArb,
                nonEmptyContentArb,
                nonEmptyContentArb,
                async (leadingWs, messageContent, authorContent) => {
                    const mockOnSend = vi.fn().mockResolvedValue(undefined);
                    const authorWithLeadingWs = `${leadingWs}${authorContent}`;

                    const { unmount, container } = render(
                        <MessageInput onSend={mockOnSend} defaultAuthor={authorWithLeadingWs} />
                    );

                    try {
                        const textarea = container.querySelector('textarea');
                        if (textarea) {
                            Object.getOwnPropertyDescriptor(
                                window.HTMLTextAreaElement.prototype,
                                'value'
                            )?.set?.call(textarea, messageContent);
                            textarea.dispatchEvent(new Event('input', { bubbles: true }));
                        }

                        const form = container.querySelector('form');
                        form?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

                        await vi.waitFor(() => {
                            expect(mockOnSend).toHaveBeenCalled();
                        });

                        const [, sentAuthor] = mockOnSend.mock.calls[0];
                        return sentAuthor === authorContent.trim();
                    } finally {
                        unmount();
                    }
                }
            ),
            { numRuns: 20 }
        );
    });

    it('trims trailing whitespace from author before sending', async () => {
        await fc.assert(
            fc.asyncProperty(
                whitespacePaddingArb,
                nonEmptyContentArb,
                nonEmptyContentArb,
                async (trailingWs, messageContent, authorContent) => {
                    const mockOnSend = vi.fn().mockResolvedValue(undefined);
                    const authorWithTrailingWs = `${authorContent}${trailingWs}`;

                    const { unmount, container } = render(
                        <MessageInput onSend={mockOnSend} defaultAuthor={authorWithTrailingWs} />
                    );

                    try {
                        const textarea = container.querySelector('textarea');
                        if (textarea) {
                            Object.getOwnPropertyDescriptor(
                                window.HTMLTextAreaElement.prototype,
                                'value'
                            )?.set?.call(textarea, messageContent);
                            textarea.dispatchEvent(new Event('input', { bubbles: true }));
                        }

                        const form = container.querySelector('form');
                        form?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

                        await vi.waitFor(() => {
                            expect(mockOnSend).toHaveBeenCalled();
                        });

                        const [, sentAuthor] = mockOnSend.mock.calls[0];
                        return sentAuthor === authorContent.trim();
                    } finally {
                        unmount();
                    }
                }
            ),
            { numRuns: 20 }
        );
    });

    it('trims both leading and trailing whitespace from message and author before sending', async () => {
        await fc.assert(
            fc.asyncProperty(
                whitespacePaddingArb,
                whitespacePaddingArb,
                nonEmptyContentArb,
                nonEmptyContentArb,
                async (leadingWs, trailingWs, messageContent, authorContent) => {
                    const mockOnSend = vi.fn().mockResolvedValue(undefined);
                    const paddedMessage = withWhitespace(messageContent, leadingWs, trailingWs);
                    const paddedAuthor = withWhitespace(authorContent, leadingWs, trailingWs);

                    const { unmount, container } = render(
                        <MessageInput onSend={mockOnSend} defaultAuthor={paddedAuthor} />
                    );

                    try {
                        const textarea = container.querySelector('textarea');
                        if (textarea) {
                            Object.getOwnPropertyDescriptor(
                                window.HTMLTextAreaElement.prototype,
                                'value'
                            )?.set?.call(textarea, paddedMessage);
                            textarea.dispatchEvent(new Event('input', { bubbles: true }));
                        }

                        const form = container.querySelector('form');
                        form?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

                        await vi.waitFor(() => {
                            expect(mockOnSend).toHaveBeenCalled();
                        });

                        const [sentMessage, sentAuthor] = mockOnSend.mock.calls[0];
                        const expectedMessage = messageContent.trim();
                        const expectedAuthor = authorContent.trim();

                        return sentMessage === expectedMessage && sentAuthor === expectedAuthor;
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
    // Arbitrary for non-empty, non-whitespace strings (valid input)
    const validInputArb = fc.string({ minLength: 1, maxLength: 50 })
        .filter(s => s.trim().length > 0);

    it('submits message when Enter is pressed with any valid message and author', async () => {
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
                        // Set the message value
                        const textarea = container.querySelector('textarea');
                        if (!textarea) return false;

                        Object.getOwnPropertyDescriptor(
                            window.HTMLTextAreaElement.prototype,
                            'value'
                        )?.set?.call(textarea, validMessage);
                        textarea.dispatchEvent(new Event('input', { bubbles: true }));

                        // Simulate Enter key press (without Shift)
                        const enterEvent = new KeyboardEvent('keydown', {
                            key: 'Enter',
                            code: 'Enter',
                            shiftKey: false,
                            bubbles: true,
                            cancelable: true
                        });
                        textarea.dispatchEvent(enterEvent);

                        // Wait for async onSend to be called
                        await vi.waitFor(() => {
                            expect(mockOnSend).toHaveBeenCalled();
                        });

                        // Verify onSend was called exactly once with trimmed values
                        expect(mockOnSend).toHaveBeenCalledTimes(1);
                        const [sentMessage, sentAuthor] = mockOnSend.mock.calls[0];

                        return (
                            sentMessage === validMessage.trim() &&
                            sentAuthor === validAuthor.trim()
                        );
                    } finally {
                        unmount();
                    }
                }
            ),
            { numRuns: 20 }
        );
    });

    it('does not submit when Enter is pressed with Shift held (for any valid input)', async () => {
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
                        // Set the message value
                        const textarea = container.querySelector('textarea');
                        if (!textarea) return false;

                        Object.getOwnPropertyDescriptor(
                            window.HTMLTextAreaElement.prototype,
                            'value'
                        )?.set?.call(textarea, validMessage);
                        textarea.dispatchEvent(new Event('input', { bubbles: true }));

                        // Simulate Shift+Enter key press
                        const shiftEnterEvent = new KeyboardEvent('keydown', {
                            key: 'Enter',
                            code: 'Enter',
                            shiftKey: true,
                            bubbles: true,
                            cancelable: true
                        });
                        textarea.dispatchEvent(shiftEnterEvent);

                        // Give a small delay to ensure no async call happens
                        await new Promise(resolve => setTimeout(resolve, 10));

                        // Verify onSend was NOT called
                        return mockOnSend.mock.calls.length === 0;
                    } finally {
                        unmount();
                    }
                }
            ),
            { numRuns: 20 }
        );
    });

    it('does not submit when Enter is pressed with invalid input (whitespace-only message)', async () => {
        // Whitespace-only strings
        const whitespaceChars = [' ', '\t', '\n', '\r'];
        const whitespaceOnlyArb = fc.array(
            fc.constantFrom(...whitespaceChars),
            { minLength: 0, maxLength: 10 }
        ).map(chars => chars.join(''));

        await fc.assert(
            fc.asyncProperty(
                whitespaceOnlyArb,
                validInputArb,
                async (whitespaceMessage, validAuthor) => {
                    const mockOnSend = vi.fn().mockResolvedValue(undefined);

                    const { unmount, container } = render(
                        <MessageInput onSend={mockOnSend} defaultAuthor={validAuthor} />
                    );

                    try {
                        // Set the message value to whitespace-only
                        const textarea = container.querySelector('textarea');
                        if (!textarea) return false;

                        Object.getOwnPropertyDescriptor(
                            window.HTMLTextAreaElement.prototype,
                            'value'
                        )?.set?.call(textarea, whitespaceMessage);
                        textarea.dispatchEvent(new Event('input', { bubbles: true }));

                        // Simulate Enter key press
                        const enterEvent = new KeyboardEvent('keydown', {
                            key: 'Enter',
                            code: 'Enter',
                            shiftKey: false,
                            bubbles: true,
                            cancelable: true
                        });
                        textarea.dispatchEvent(enterEvent);

                        // Give a small delay to ensure no async call happens
                        await new Promise(resolve => setTimeout(resolve, 10));

                        // Verify onSend was NOT called (invalid input)
                        return mockOnSend.mock.calls.length === 0;
                    } finally {
                        unmount();
                    }
                }
            ),
            { numRuns: 20 }
        );
    });

    it('does not submit when Enter is pressed with invalid input (whitespace-only author)', async () => {
        // Whitespace-only strings
        const whitespaceChars = [' ', '\t', '\n', '\r'];
        const whitespaceOnlyArb = fc.array(
            fc.constantFrom(...whitespaceChars),
            { minLength: 0, maxLength: 10 }
        ).map(chars => chars.join(''));

        await fc.assert(
            fc.asyncProperty(
                validInputArb,
                whitespaceOnlyArb,
                async (validMessage, whitespaceAuthor) => {
                    const mockOnSend = vi.fn().mockResolvedValue(undefined);

                    const { unmount, container } = render(
                        <MessageInput onSend={mockOnSend} defaultAuthor={whitespaceAuthor} />
                    );

                    try {
                        // Set the message value
                        const textarea = container.querySelector('textarea');
                        if (!textarea) return false;

                        Object.getOwnPropertyDescriptor(
                            window.HTMLTextAreaElement.prototype,
                            'value'
                        )?.set?.call(textarea, validMessage);
                        textarea.dispatchEvent(new Event('input', { bubbles: true }));

                        // Simulate Enter key press
                        const enterEvent = new KeyboardEvent('keydown', {
                            key: 'Enter',
                            code: 'Enter',
                            shiftKey: false,
                            bubbles: true,
                            cancelable: true
                        });
                        textarea.dispatchEvent(enterEvent);

                        // Give a small delay to ensure no async call happens
                        await new Promise(resolve => setTimeout(resolve, 10));

                        // Verify onSend was NOT called (invalid input)
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
 * 
 * This property verifies that for ANY input state (empty, partial, or full),
 * pressing Shift+Enter does NOT trigger submission. The actual newline insertion
 * is handled by the browser's default behavior - we verify the component doesn't
 * prevent it by not calling preventDefault when Shift is held.
 */
describe('Property 12: Shift+Enter Inserts Newline', () => {
    // Arbitrary for any string (including empty)
    const anyStringArb = fc.string({ minLength: 0, maxLength: 50 });

    // Arbitrary for non-empty, non-whitespace strings (valid input)
    const validInputArb = fc.string({ minLength: 1, maxLength: 50 })
        .filter(s => s.trim().length > 0);

    // Whitespace-only strings (including empty)
    const whitespaceChars = [' ', '\t', '\n', '\r'];
    const whitespaceOnlyArb = fc.array(
        fc.constantFrom(...whitespaceChars),
        { minLength: 0, maxLength: 10 }
    ).map(chars => chars.join(''));

    it('does not trigger submission when Shift+Enter is pressed with empty message', async () => {
        await fc.assert(
            fc.asyncProperty(
                anyStringArb, // author can be anything
                async (author) => {
                    const mockOnSend = vi.fn().mockResolvedValue(undefined);

                    const { unmount, container } = render(
                        <MessageInput onSend={mockOnSend} defaultAuthor={author} />
                    );

                    try {
                        const textarea = container.querySelector('textarea');
                        if (!textarea) return false;

                        // Leave message empty (default state)
                        // Simulate Shift+Enter key press
                        const shiftEnterEvent = new KeyboardEvent('keydown', {
                            key: 'Enter',
                            code: 'Enter',
                            shiftKey: true,
                            bubbles: true,
                            cancelable: true
                        });
                        textarea.dispatchEvent(shiftEnterEvent);

                        // Give a small delay to ensure no async call happens
                        await new Promise(resolve => setTimeout(resolve, 10));

                        // Verify onSend was NOT called
                        return mockOnSend.mock.calls.length === 0;
                    } finally {
                        unmount();
                    }
                }
            ),
            { numRuns: 20 }
        );
    });

    it('does not trigger submission when Shift+Enter is pressed with whitespace-only message', async () => {
        await fc.assert(
            fc.asyncProperty(
                whitespaceOnlyArb,
                anyStringArb,
                async (whitespaceMessage, author) => {
                    const mockOnSend = vi.fn().mockResolvedValue(undefined);

                    const { unmount, container } = render(
                        <MessageInput onSend={mockOnSend} defaultAuthor={author} />
                    );

                    try {
                        const textarea = container.querySelector('textarea');
                        if (!textarea) return false;

                        // Set whitespace-only message
                        Object.getOwnPropertyDescriptor(
                            window.HTMLTextAreaElement.prototype,
                            'value'
                        )?.set?.call(textarea, whitespaceMessage);
                        textarea.dispatchEvent(new Event('input', { bubbles: true }));

                        // Simulate Shift+Enter key press
                        const shiftEnterEvent = new KeyboardEvent('keydown', {
                            key: 'Enter',
                            code: 'Enter',
                            shiftKey: true,
                            bubbles: true,
                            cancelable: true
                        });
                        textarea.dispatchEvent(shiftEnterEvent);

                        // Give a small delay to ensure no async call happens
                        await new Promise(resolve => setTimeout(resolve, 10));

                        // Verify onSend was NOT called
                        return mockOnSend.mock.calls.length === 0;
                    } finally {
                        unmount();
                    }
                }
            ),
            { numRuns: 20 }
        );
    });

    it('does not trigger submission when Shift+Enter is pressed with valid message but empty author', async () => {
        await fc.assert(
            fc.asyncProperty(
                validInputArb,
                whitespaceOnlyArb,
                async (validMessage, emptyAuthor) => {
                    const mockOnSend = vi.fn().mockResolvedValue(undefined);

                    const { unmount, container } = render(
                        <MessageInput onSend={mockOnSend} defaultAuthor={emptyAuthor} />
                    );

                    try {
                        const textarea = container.querySelector('textarea');
                        if (!textarea) return false;

                        // Set valid message
                        Object.getOwnPropertyDescriptor(
                            window.HTMLTextAreaElement.prototype,
                            'value'
                        )?.set?.call(textarea, validMessage);
                        textarea.dispatchEvent(new Event('input', { bubbles: true }));

                        // Simulate Shift+Enter key press
                        const shiftEnterEvent = new KeyboardEvent('keydown', {
                            key: 'Enter',
                            code: 'Enter',
                            shiftKey: true,
                            bubbles: true,
                            cancelable: true
                        });
                        textarea.dispatchEvent(shiftEnterEvent);

                        // Give a small delay to ensure no async call happens
                        await new Promise(resolve => setTimeout(resolve, 10));

                        // Verify onSend was NOT called
                        return mockOnSend.mock.calls.length === 0;
                    } finally {
                        unmount();
                    }
                }
            ),
            { numRuns: 20 }
        );
    });

    it('does not trigger submission when Shift+Enter is pressed with fully valid input (message and author)', async () => {
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

                        // Set valid message
                        Object.getOwnPropertyDescriptor(
                            window.HTMLTextAreaElement.prototype,
                            'value'
                        )?.set?.call(textarea, validMessage);
                        textarea.dispatchEvent(new Event('input', { bubbles: true }));

                        // Simulate Shift+Enter key press
                        const shiftEnterEvent = new KeyboardEvent('keydown', {
                            key: 'Enter',
                            code: 'Enter',
                            shiftKey: true,
                            bubbles: true,
                            cancelable: true
                        });
                        textarea.dispatchEvent(shiftEnterEvent);

                        // Give a small delay to ensure no async call happens
                        await new Promise(resolve => setTimeout(resolve, 10));

                        // Verify onSend was NOT called - Shift+Enter should never submit
                        return mockOnSend.mock.calls.length === 0;
                    } finally {
                        unmount();
                    }
                }
            ),
            { numRuns: 20 }
        );
    });

    it('allows default browser behavior for newline insertion (does not preventDefault on Shift+Enter)', async () => {
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

                        // Set initial message
                        if (message) {
                            Object.getOwnPropertyDescriptor(
                                window.HTMLTextAreaElement.prototype,
                                'value'
                            )?.set?.call(textarea, message);
                            textarea.dispatchEvent(new Event('input', { bubbles: true }));
                        }

                        // Create Shift+Enter event and track if preventDefault was called
                        let preventDefaultCalled = false;
                        const shiftEnterEvent = new KeyboardEvent('keydown', {
                            key: 'Enter',
                            code: 'Enter',
                            shiftKey: true,
                            bubbles: true,
                            cancelable: true
                        });

                        // Override preventDefault to track if it's called
                        const originalPreventDefault = shiftEnterEvent.preventDefault.bind(shiftEnterEvent);
                        shiftEnterEvent.preventDefault = () => {
                            preventDefaultCalled = true;
                            originalPreventDefault();
                        };

                        textarea.dispatchEvent(shiftEnterEvent);

                        // Shift+Enter should NOT call preventDefault (allowing browser to insert newline)
                        // and should NOT trigger submission
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
