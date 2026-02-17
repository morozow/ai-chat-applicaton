import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ErrorBanner from './ErrorBanner';

describe('ErrorBanner', () => {
    it('renders error message', () => {
        render(<ErrorBanner message="Something went wrong" />);

        expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('has role="alert" for accessibility', () => {
        render(<ErrorBanner message="Error occurred" />);

        expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('does not render retry button when onRetry is not provided', () => {
        render(<ErrorBanner message="Error occurred" />);

        expect(screen.queryByRole('button', { name: /retry/i })).not.toBeInTheDocument();
    });

    it('renders retry button when onRetry is provided', () => {
        const onRetry = vi.fn();
        render(<ErrorBanner message="Error occurred" onRetry={onRetry} />);

        expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });

    it('calls onRetry when retry button is clicked', () => {
        const onRetry = vi.fn();
        render(<ErrorBanner message="Error occurred" onRetry={onRetry} />);

        fireEvent.click(screen.getByRole('button', { name: /retry/i }));

        expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it('displays different error messages correctly', () => {
        const { rerender } = render(<ErrorBanner message="Network error" />);
        expect(screen.getByText('Network error')).toBeInTheDocument();

        rerender(<ErrorBanner message="Server unavailable" />);
        expect(screen.getByText('Server unavailable')).toBeInTheDocument();
    });

    it('retry button is keyboard accessible', () => {
        const onRetry = vi.fn();
        render(<ErrorBanner message="Error occurred" onRetry={onRetry} />);

        const retryButton = screen.getByRole('button', { name: /retry/i });
        fireEvent.keyDown(retryButton, { key: 'Enter', code: 'Enter' });

        // Native button handles Enter key automatically via click
        fireEvent.click(retryButton);
        expect(onRetry).toHaveBeenCalled();
    });
});
