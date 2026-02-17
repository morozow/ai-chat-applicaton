import { useRef, useCallback } from 'react';
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

  const messageListRef = useRef<HTMLDivElement>(null);

  /**
   * Scrolls the message list to the bottom.
   * Called after successfully sending a message.
   */
  const scrollToBottom = useCallback(() => {
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  }, []);

  /**
   * Handles sending a message and scrolling to bottom on success.
   * @requirements 4.6, 4.7
   */
  const handleSendMessage = useCallback(async (message: string, author: string) => {
    await sendMessage(message, author);
    // Scroll to bottom after successful send
    // Use setTimeout to ensure the DOM has updated with the new message
    setTimeout(scrollToBottom, 0);
  }, [sendMessage, scrollToBottom]);

  return (
    <ChatLayout>
      {/* Error banner - shown when there's an error */}
      {error && (
        <ErrorBanner
          message={error.message || 'An error occurred'}
          onRetry={retry}
        />
      )}

      {/* Message list with ref for scroll control */}
      <div ref={messageListRef} style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <MessageList
          messages={messages}
          isLoading={isLoading}
          onLoadMore={loadMore}
          hasMore={hasMore}
        />
      </div>

      {/* Message input form */}
      <MessageInput
        onSend={handleSendMessage}
        disabled={isSending}
      />
    </ChatLayout>
  );
}

export default App;
