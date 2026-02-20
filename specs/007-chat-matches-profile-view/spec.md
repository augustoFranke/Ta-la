# Tá lá! — Spec 007: Chat, matched profile view & unmatch

## 1) Problem statement (why)
Matched users need a simple, reliable chat experience with controls to disconnect safely.

## 2) Scope
**In scope**
- Chats list
- One-to-one chat: text, emoji, photo upload, voice messages
- View matched profile (only)
- Suspend connection and permanently remove chat (“unmatch”)

**Out of scope**
- Group chat
- Typing indicators (v1)

## 3) Users & workflows
**Happy path**
1. User opens Chat tab.
2. Sees list of active chats.
3. Opens chat, sends messages.
4. Opens matched profile, returns to chat.
5. Unmatches/removes chat if desired.

## 4) Functional requirements
### Eligibility & access (MUST)
- Chat tab shows only chats with matched users.
- User must not view profiles of non-matched users.

### Profile view (MUST)
Profile view must show:
- name
- 3-photo carousel
- bio
- top-right “back to chat” arrow

### Unmatch/remove (MUST)
- User can suspend connection and permanently remove chat.
- After removal:
  - chat disappears for both users
  - users cannot message each other
  - users should not reappear to each other in the same venue feed session (anti-harassment loop prevention)

### Messaging (MUST)
Support:
- text
- emoji
- photo upload
- voice messages

Sending failures must show:
- “failed” state + retry
- no duplicate messages on retry

## 5) Acceptance criteria (Given/When/Then)
- Given two matched users  
  When one sends a message  
  Then the other receives it and it appears in history.

- Given a user removes a chat  
  When removal completes  
  Then messages are no longer accessible and chat disappears from the list for both.

### Edge cases
- Offline behavior: define and implement one policy (queue & send later OR fail explicitly).
- Photo too large → block with explicit size limit message.
- Voice recording interrupted → allow discard or retry.

## 6) Data & contracts
- Chat history order must be consistent.
- Unmatch event must revoke access to history and disable future messaging.

## 7) Non-functional requirements
- Local “pending bubble” appears ≤ **300ms** after send.
- Message delivery P95 ≤ **2s** on stable networks.

## 8) Definition of Done
- E2E: match → chat appears → send/receive → view profile → unmatch removes chat.
- Media tests: photo + voice flows (success + failure).
