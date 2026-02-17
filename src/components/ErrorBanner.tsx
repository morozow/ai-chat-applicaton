import styles from './ErrorBanner.module.css';

interface ErrorBannerProps {
    message: string;
    onRetry?: () => void;
}

function ErrorBanner({ message, onRetry }: ErrorBannerProps) {
    return (
        <div className={styles.banner} role="alert">
            <span className={styles.message}>{message}</span>
            {onRetry && (
                <button
                    type="button"
                    className={styles.retryButton}
                    onClick={onRetry}
                    aria-label="Retry"
                >
                    Retry
                </button>
            )}
        </div>
    );
}

export default ErrorBanner;
