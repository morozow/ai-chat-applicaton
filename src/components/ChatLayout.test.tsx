import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ChatLayout from './ChatLayout';

describe('ChatLayout', () => {
    it('renders children correctly', () => {
        render(
            <ChatLayout>
                <div data-testid="child">Test Content</div>
            </ChatLayout>
        );

        expect(screen.getByTestId('child')).toBeInTheDocument();
        expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('renders as a main element for semantic HTML', () => {
        render(<ChatLayout>Content</ChatLayout>);

        const main = screen.getByRole('main');
        expect(main).toBeInTheDocument();
    });

    it('renders without children', () => {
        render(<ChatLayout />);

        const main = screen.getByRole('main');
        expect(main).toBeInTheDocument();
    });

    it('applies container styles', () => {
        render(<ChatLayout>Content</ChatLayout>);

        const main = screen.getByRole('main');
        // CSS modules hash class names, so we check for partial match
        expect(main.className).toMatch(/container/);
    });

    it('renders multiple children', () => {
        render(
            <ChatLayout>
                <div data-testid="first">First</div>
                <div data-testid="second">Second</div>
            </ChatLayout>
        );

        expect(screen.getByTestId('first')).toBeInTheDocument();
        expect(screen.getByTestId('second')).toBeInTheDocument();
    });
});
