import type { ReactNode } from 'react';
import styles from './ChatLayout.module.css';

interface ChatLayoutProps {
    children?: ReactNode;
}

/**
 * Main layout wrapper for the chat application.
 * Provides:
 * - Centered container with max-width on desktop (800-960px)
 * - Full-width on mobile with comfortable spacing
 * - Flex column layout for message list and input
 *
 * @requirements 7.1, 7.2, 7.4
 */
function ChatLayout({ children }: ChatLayoutProps): React.JSX.Element {
    return (
        <main className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>Chat Application</h1>
            </header>
            {children}
        </main>
    );
}

export default ChatLayout;
