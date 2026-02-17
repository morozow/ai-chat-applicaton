import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Loader from './Loader';

describe('Loader', () => {
    it('renders with default medium size', () => {
        render(<Loader />);

        const loader = screen.getByRole('status');
        expect(loader).toBeInTheDocument();
    });

    it('includes visually hidden loading text for screen readers', () => {
        render(<Loader />);

        const loadingText = screen.getByText('Loading...');
        expect(loadingText).toBeInTheDocument();
        expect(loadingText).toHaveClass('visually-hidden');
    });

    it('has aria-live="polite" for accessibility', () => {
        render(<Loader />);

        const loader = screen.getByRole('status');
        expect(loader).toHaveAttribute('aria-live', 'polite');
    });

    it('renders with small size variant', () => {
        const { container } = render(<Loader size="small" />);

        const spinner = container.querySelector('[class*="spinner"]');
        expect(spinner).toHaveClass(/small/);
    });

    it('renders with medium size variant', () => {
        const { container } = render(<Loader size="medium" />);

        const spinner = container.querySelector('[class*="spinner"]');
        expect(spinner).toHaveClass(/medium/);
    });

    it('renders with large size variant', () => {
        const { container } = render(<Loader size="large" />);

        const spinner = container.querySelector('[class*="spinner"]');
        expect(spinner).toHaveClass(/large/);
    });
});
