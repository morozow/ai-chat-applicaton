import styles from './Loader.module.css';

interface LoaderProps {
    size?: 'small' | 'medium' | 'large';
}

function Loader({ size = 'medium' }: LoaderProps) {
    return (
        <div className={styles.loader} role="status" aria-live="polite">
            <div className={`${styles.spinner} ${styles[size]}`} />
            <span className="visually-hidden">Loading...</span>
        </div>
    );
}

export default Loader;
