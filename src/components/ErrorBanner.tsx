import styles from './ErrorBanner.module.css';

interface ErrorBannerProps {
    message: string;
    onRetry?: () => void;
}

function ErrorBanner({ message, onRetry }: ErrorBannerProps) {
    // Split message by newlines to handle multiple validation errors
    const errorLines = message.split('\n').filter(Boolean);
    const hasMultipleErrors = errorLines.length > 1;

    return (
        <div className={styles.banner} role="alert">
            <div className={styles.messageContainer}>
                {hasMultipleErrors ? (
                    <ul className={styles.errorList}>
                        {errorLines.map((line, index) => (
                            <li key={index} className={styles.errorItem}>{line}</li>
                        ))}
                    </ul>
                ) : (
                    <span className={styles.message}>{message}</span>
                )}
            </div>
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
