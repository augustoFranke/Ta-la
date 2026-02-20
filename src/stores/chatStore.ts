/**
 * Chat Zustand store — Spec 007
 * Holds the match list and per-match message arrays.
 */

import { create } from 'zustand';
import type { ChatMatch, Message } from '../types/database';

interface ChatState {
  matches: ChatMatch[];
  /** Messages keyed by match_id */
  messagesByMatch: Record<string, Message[]>;
  isLoadingMatches: boolean;
  isLoadingMessages: boolean;
  isSending: boolean;

  setMatches: (matches: ChatMatch[]) => void;
  setMessages: (matchId: string, messages: Message[]) => void;
  /** Append an optimistic or confirmed message */
  appendMessage: (matchId: string, message: Message) => void;
  /** Replace a pending message (by id) with its confirmed version */
  replaceMessage: (matchId: string, clientId: string, confirmed: Message) => void;
  /** Mark a message as failed */
  markMessageFailed: (matchId: string, messageId: string) => void;
  /** Remove a match and its messages (after unmatch) */
  removeMatch: (matchId: string) => void;
  setLoadingMatches: (v: boolean) => void;
  setLoadingMessages: (v: boolean) => void;
  setSending: (v: boolean) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  matches: [],
  messagesByMatch: {},
  isLoadingMatches: false,
  isLoadingMessages: false,
  isSending: false,

  setMatches: (matches) => set({ matches }),

  setMessages: (matchId, messages) =>
    set((state) => ({
      messagesByMatch: { ...state.messagesByMatch, [matchId]: messages },
    })),

  appendMessage: (matchId, message) =>
    set((state) => {
      const existing = state.messagesByMatch[matchId] ?? [];
      return {
        messagesByMatch: {
          ...state.messagesByMatch,
          [matchId]: [...existing, message],
        },
      };
    }),

  replaceMessage: (matchId, clientId, confirmed) =>
    set((state) => {
      const existing = state.messagesByMatch[matchId] ?? [];
      return {
        messagesByMatch: {
          ...state.messagesByMatch,
          [matchId]: existing.map((m) => (m.id === clientId ? confirmed : m)),
        },
      };
    }),

  markMessageFailed: (matchId, messageId) =>
    set((state) => {
      const existing = state.messagesByMatch[matchId] ?? [];
      return {
        messagesByMatch: {
          ...state.messagesByMatch,
          [matchId]: existing.map((m) =>
            m.id === messageId ? { ...m, status: 'failed' } : m,
          ),
        },
      };
    }),

  removeMatch: (matchId) =>
    set((state) => {
      const { [matchId]: _, ...rest } = state.messagesByMatch;
      return {
        matches: state.matches.filter((m) => m.match_id !== matchId),
        messagesByMatch: rest,
      };
    }),

  setLoadingMatches: (v) => set({ isLoadingMatches: v }),
  setLoadingMessages: (v) => set({ isLoadingMessages: v }),
  setSending: (v) => set({ isSending: v }),
}));
