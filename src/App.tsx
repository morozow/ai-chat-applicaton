import { useCallback } from 'react';
import ChatLayout from './components/ChatLayout';
import MessageList from './components/MessageList';
import MessageInput from './components/MessageInput';
import ErrorBanner from './components/ErrorBanner';
import { useMessages } from './hooks/useMessages';
import './App.css';

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

  /**
   * Handles sending a message.
   * @requirements 4.6, 4.7
   */
  const handleSendMessage = useCallback(async (message: string, author: string) => {
    await sendMessage(message, author);
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
