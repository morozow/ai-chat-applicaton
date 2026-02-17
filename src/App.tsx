import { useCallback, useState, useEffect } from 'react';
import ChatLayout from './components/ChatLayout';
import MessageList from './components/MessageList';
import MessageInput from './components/MessageInput';
import ErrorBanner from './components/ErrorBanner';
import { useMessages } from './hooks/useMessages';
import './App.css';

const AUTHOR_STORAGE_KEY = 'chat_author_name';

/**
 * Main App component that integrates all chat components.
 * 
 * Handles:
 * - Fetching messages on mount (via useMessages hook)
 * - Loading, error, and success states
 * - Scroll to bottom on new message
 * 
 * @requirements 2.1, 4.6, 4.7
 */
function App() {
  const {
    messages,
    isLoading,
    isSending,
    error,
    sendMessage,
    loadMore,
    retry,
    hasMore,
  } = useMessages();

  // Track current user from localStorage
  const [currentUser, setCurrentUser] = useState<string>(() => {
    return localStorage.getItem(AUTHOR_STORAGE_KEY) || '';
  });

  // Listen for localStorage changes (when user sends first message)
  useEffect(() => {
    const handleStorageChange = () => {
      setCurrentUser(localStorage.getItem(AUTHOR_STORAGE_KEY) || '');
    };

    // Check periodically for changes (storage event doesn't fire in same tab)
    const interval = setInterval(handleStorageChange, 500);

    return () => clearInterval(interval);
  }, []);

  /**
   * Handles sending a message.
   * @requirements 4.6, 4.7
   */
  const handleSendMessage = useCallback(async (message: string, author: string) => {
    await sendMessage(message, author);
    // Update currentUser after sending (in case it was first message)
    setCurrentUser(author);
  }, [sendMessage]);

  return (
    <ChatLayout>
      {/* Error banner - shown when there's an error */}
      {error && (
        <ErrorBanner
          message={error.message || 'An error occurred'}
          onRetry={retry}
        />
      )}

      {/* Message list - takes remaining space and scrolls internally */}
      <MessageList
        messages={messages}
        isLoading={isLoading}
        onLoadMore={loadMore}
        hasMore={hasMore}
        currentUser={currentUser}
      />

      {/* Message input form */}
      <MessageInput
        onSend={handleSendMessage}
        disabled={isSending}
      />
    </ChatLayout>
  );
}

export default App;
