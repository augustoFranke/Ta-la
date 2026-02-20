/**
 * useChat — Spec 007
 * Hook that exposes chat match list + messaging actions.
 */

import { useCallback } from 'react';
import { useChatStore } from '../stores/chatStore';
import {
  fetchChatMatches,
  fetchMessages,
  sendMessage as sendMessageService,
  unmatch as unmatchService,
} from '../services/chat';
import type { MessageType } from '../types/database';

function newUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export function useChat(userId: string | null) {
  const {
    matches,
    messagesByMatch,
    isLoadingMatches,
    isLoadingMessages,
    isSending,
    setMatches,
    setMessages,
    appendMessage,
    replaceMessage,
    markMessageFailed,
    removeMatch,
    setLoadingMatches,
    setLoadingMessages,
    setSending,
  } = useChatStore();

  const loadMatches = useCallback(async () => {
    if (!userId) return;
    setLoadingMatches(true);
    try {
      const data = await fetchChatMatches(userId);
      setMatches(data);
    } finally {
      setLoadingMatches(false);
    }
  }, [userId, setMatches, setLoadingMatches]);

  const loadMessages = useCallback(
    async (matchId: string) => {
      setLoadingMessages(true);
      try {
        const data = await fetchMessages(matchId);
        setMessages(matchId, data);
      } finally {
        setLoadingMessages(false);
      }
    },
    [setMessages, setLoadingMessages],
  );

  /**
   * Sends a message with optimistic UI:
   * 1. Append a pending bubble immediately (≤300ms per spec).
   * 2. Await the server call.
   * 3. Replace pending with confirmed, or mark as failed.
   */
  const sendMessage = useCallback(
    async (matchId: string, content: string, type: MessageType = 'text') => {
      if (!userId || !content.trim()) return;

      const clientId = newUUID();
      const now = new Date().toISOString();

      // Optimistic bubble
      appendMessage(matchId, {
        id: clientId,
        match_id: matchId,
        sender_id: userId,
        content,
        type,
        status: 'pending',
        created_at: now,
      });

      setSending(true);
      try {
        const confirmed = await sendMessageService(matchId, userId, content, type, clientId);
        replaceMessage(matchId, clientId, confirmed);
      } catch {
        markMessageFailed(matchId, clientId);
      } finally {
        setSending(false);
      }
    },
    [userId, appendMessage, replaceMessage, markMessageFailed, setSending],
  );

  /**
   * Retries a failed message with the same content.
   * Generates a new clientId to avoid server-side duplicate (the old id stays failed in store,
   * a new pending bubble is added and then confirmed/failed).
   */
  const retryMessage = useCallback(
    async (matchId: string, content: string, type: MessageType) => {
      await sendMessage(matchId, content, type);
    },
    [sendMessage],
  );

  const doUnmatch = useCallback(
    async (matchId: string) => {
      if (!userId) return;
      await unmatchService(matchId, userId);
      removeMatch(matchId);
    },
    [userId, removeMatch],
  );

  return {
    matches,
    messagesByMatch,
    isLoadingMatches,
    isLoadingMessages,
    isSending,
    loadMatches,
    loadMessages,
    sendMessage,
    retryMessage,
    unmatch: doUnmatch,
  };
}
