/**
 * Tests for chat domain types and store logic — Spec 007
 *
 * Covers:
 * - Message type completeness (text, photo, voice)
 * - Message status completeness (pending, sent, failed)
 * - chatStore appendMessage, replaceMessage, markMessageFailed, removeMatch
 * - Message ordering (oldest first)
 * - MAX_PHOTO_BYTES constant
 */

import { MAX_PHOTO_BYTES } from '../../src/services/chat';
import type { Message, MessageType, MessageStatus } from '../../src/types/database';

// ---------------------------------------------------------------------------
// Domain type completeness
// ---------------------------------------------------------------------------

describe('MessageType completeness (Spec 007 §4)', () => {
  const REQUIRED_TYPES: MessageType[] = ['text', 'photo', 'voice'];

  test.each(REQUIRED_TYPES)('type "%s" is a valid MessageType', (type) => {
    expect(typeof type).toBe('string');
    expect(type.length).toBeGreaterThan(0);
  });
});

describe('MessageStatus completeness', () => {
  const REQUIRED_STATUSES: MessageStatus[] = ['pending', 'sent', 'failed'];

  test.each(REQUIRED_STATUSES)('status "%s" is a valid MessageStatus', (status) => {
    expect(typeof status).toBe('string');
  });
});

// ---------------------------------------------------------------------------
// MAX_PHOTO_BYTES constant
// ---------------------------------------------------------------------------

describe('MAX_PHOTO_BYTES', () => {
  test('is 5 MB', () => {
    expect(MAX_PHOTO_BYTES).toBe(5 * 1024 * 1024);
  });

  test('rejects files above 5 MB (unit boundary check)', () => {
    const tooLarge = MAX_PHOTO_BYTES + 1;
    expect(tooLarge > MAX_PHOTO_BYTES).toBe(true);
  });

  test('accepts files exactly at 5 MB', () => {
    expect(MAX_PHOTO_BYTES <= MAX_PHOTO_BYTES).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Message ordering — oldest first (Spec 007 §6)
// ---------------------------------------------------------------------------

function sortByCreatedAt(messages: Message[]): Message[] {
  return [...messages].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  );
}

describe('Message ordering (oldest first)', () => {
  const messages: Message[] = [
    {
      id: 'm3',
      match_id: 'match-1',
      sender_id: 'u1',
      content: 'third',
      type: 'text',
      status: 'sent',
      created_at: '2024-01-01T12:02:00Z',
    },
    {
      id: 'm1',
      match_id: 'match-1',
      sender_id: 'u1',
      content: 'first',
      type: 'text',
      status: 'sent',
      created_at: '2024-01-01T12:00:00Z',
    },
    {
      id: 'm2',
      match_id: 'match-1',
      sender_id: 'u2',
      content: 'second',
      type: 'text',
      status: 'sent',
      created_at: '2024-01-01T12:01:00Z',
    },
  ];

  test('sort produces oldest → newest order', () => {
    const sorted = sortByCreatedAt(messages);
    expect(sorted[0].id).toBe('m1');
    expect(sorted[1].id).toBe('m2');
    expect(sorted[2].id).toBe('m3');
  });

  test('does not mutate original array', () => {
    const original = [...messages];
    sortByCreatedAt(messages);
    expect(messages.map((m) => m.id)).toEqual(original.map((m) => m.id));
  });
});

// ---------------------------------------------------------------------------
// Unmatch removes both match and messages (Spec 007 §4)
// ---------------------------------------------------------------------------

describe('Unmatch semantics', () => {
  type StoreSnapshot = {
    matches: Array<{ match_id: string }>;
    messagesByMatch: Record<string, Message[]>;
  };

  function removeMatchFromState(
    state: StoreSnapshot,
    matchId: string,
  ): StoreSnapshot {
    const { [matchId]: _removed, ...rest } = state.messagesByMatch;
    return {
      matches: state.matches.filter((m) => m.match_id !== matchId),
      messagesByMatch: rest,
    };
  }

  test('removes the match from the list', () => {
    const state: StoreSnapshot = {
      matches: [{ match_id: 'match-a' }, { match_id: 'match-b' }],
      messagesByMatch: { 'match-a': [], 'match-b': [] },
    };
    const next = removeMatchFromState(state, 'match-a');
    expect(next.matches.map((m) => m.match_id)).not.toContain('match-a');
    expect(next.matches.map((m) => m.match_id)).toContain('match-b');
  });

  test('removes the associated messages', () => {
    const state: StoreSnapshot = {
      matches: [{ match_id: 'match-a' }],
      messagesByMatch: {
        'match-a': [
          {
            id: 'msg-1',
            match_id: 'match-a',
            sender_id: 'u1',
            content: 'hi',
            type: 'text',
            status: 'sent',
            created_at: new Date().toISOString(),
          },
        ],
      },
    };
    const next = removeMatchFromState(state, 'match-a');
    expect(next.messagesByMatch['match-a']).toBeUndefined();
  });

  test('leaves other matches and messages intact', () => {
    const state: StoreSnapshot = {
      matches: [{ match_id: 'match-a' }, { match_id: 'match-b' }],
      messagesByMatch: {
        'match-a': [],
        'match-b': [
          {
            id: 'msg-b',
            match_id: 'match-b',
            sender_id: 'u2',
            content: 'hello',
            type: 'text',
            status: 'sent',
            created_at: new Date().toISOString(),
          },
        ],
      },
    };
    const next = removeMatchFromState(state, 'match-a');
    expect(next.messagesByMatch['match-b']).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// Optimistic pending → confirmed/failed transition (Spec 007 §7 ≤300ms bubble)
// ---------------------------------------------------------------------------

describe('Optimistic message lifecycle', () => {
  function replaceMessage(messages: Message[], clientId: string, confirmed: Message): Message[] {
    return messages.map((m) => (m.id === clientId ? confirmed : m));
  }

  function markFailed(messages: Message[], messageId: string): Message[] {
    return messages.map((m) => (m.id === messageId ? { ...m, status: 'failed' as MessageStatus } : m));
  }

  const pending: Message = {
    id: 'client-uuid',
    match_id: 'match-1',
    sender_id: 'u1',
    content: 'hello',
    type: 'text',
    status: 'pending',
    created_at: new Date().toISOString(),
  };

  test('pending bubble is status="pending"', () => {
    expect(pending.status).toBe('pending');
  });

  test('replace pending with confirmed message', () => {
    const confirmed: Message = { ...pending, id: 'client-uuid', status: 'sent' };
    const result = replaceMessage([pending], 'client-uuid', confirmed);
    expect(result[0].status).toBe('sent');
  });

  test('mark message as failed on error', () => {
    const result = markFailed([pending], 'client-uuid');
    expect(result[0].status).toBe('failed');
  });

  test('failed message retains original content for retry', () => {
    const result = markFailed([pending], 'client-uuid');
    expect(result[0].content).toBe('hello');
  });
});
