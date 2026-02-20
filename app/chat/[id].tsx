/**
 * Chat Conversation Screen — Spec 007
 * One-to-one text/emoji/photo/voice chat between matched users.
 * Accessible only from Chat list (matched users only).
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/theme';
import { useAuth } from '../../src/hooks/useAuth';
import { useChat } from '../../src/hooks/useChat';
import { Avatar } from '../../src/components/ui/Avatar';
import { useChatStore } from '../../src/stores/chatStore';
import type { Message } from '../../src/types/database';

export default function ChatConversationScreen() {
  const { id: matchId } = useLocalSearchParams<{ id: string }>();
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { matches, isLoadingMessages, isSending, loadMessages, sendMessage, unmatch } = useChat(
    user?.id ?? null,
  );
  const messages = useChatStore((s) => s.messagesByMatch[matchId ?? ''] ?? []);

  const [inputText, setInputText] = useState('');
  const listRef = useRef<FlatList>(null);

  const match = matches.find((m) => m.match_id === matchId);

  useEffect(() => {
    if (matchId) loadMessages(matchId);
  }, [matchId, loadMessages]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (messages.length > 0) {
      listRef.current?.scrollToEnd({ animated: true });
    }
  }, [messages.length]);

  const handleSend = useCallback(async () => {
    const text = inputText.trim();
    if (!text || !matchId) return;
    setInputText('');
    await sendMessage(matchId, text, 'text');
  }, [inputText, matchId, sendMessage]);

  const handleRetry = useCallback(
    (msg: Message) => {
      if (!matchId) return;
      sendMessage(matchId, msg.content, msg.type);
    },
    [matchId, sendMessage],
  );

  const handleViewProfile = useCallback(() => {
    if (match?.partner_id) {
      router.push(`/chat/${matchId}/profile`);
    }
  }, [match?.partner_id, matchId, router]);

  const handleUnmatch = useCallback(() => {
    Alert.alert(
      'Remover conexão',
      `Tem certeza que deseja remover sua conexão com ${match?.partner_name ?? 'esta pessoa'}? O chat será apagado permanentemente.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            try {
              await unmatch(matchId ?? '');
              router.back();
            } catch {
              Alert.alert('Erro', 'Não foi possível remover a conexão. Tente novamente.');
            }
          },
        },
      ],
    );
  }, [match?.partner_name, matchId, unmatch, router]);

  const renderMessage = useCallback(
    ({ item }: { item: Message }) => {
      const isOwn = item.sender_id === user?.id;
      const isFailed = item.status === 'failed';
      const isPending = item.status === 'pending';

      return (
        <View style={[styles.messageBubbleWrapper, isOwn ? styles.ownWrapper : styles.otherWrapper]}>
          <View
            style={[
              styles.bubble,
              isOwn
                ? [styles.ownBubble, { backgroundColor: colors.primary }]
                : [styles.otherBubble, { backgroundColor: colors.card }],
              isFailed && styles.failedBubble,
            ]}
          >
            <Text
              style={[
                styles.bubbleText,
                { color: isOwn ? colors.onPrimary : colors.text },
                isPending && styles.pendingText,
              ]}
            >
              {item.content}
            </Text>
          </View>
          {isFailed && (
            <TouchableOpacity onPress={() => handleRetry(item)} style={styles.retryButton}>
              <Ionicons name="refresh" size={14} color={colors.error ?? '#ef4444'} />
              <Text style={[styles.retryText, { color: colors.error ?? '#ef4444' }]}>Tentar novamente</Text>
            </TouchableOpacity>
          )}
        </View>
      );
    },
    [colors, user?.id, handleRetry],
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top', 'left', 'right']}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.headerCenter} onPress={handleViewProfile}>
          <Avatar name={match?.partner_name ?? ''} url={match?.partner_photo_url} size={38} />
          <Text style={[styles.headerName, { color: colors.text }]} numberOfLines={1}>
            {match?.partner_name ?? ''}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleUnmatch} style={styles.unmatchButton}>
          <Ionicons name="close-circle-outline" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {isLoadingMessages ? (
          <View style={styles.loadingState}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            contentContainerStyle={[styles.messageList, { paddingHorizontal: 16 }]}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <Text style={[styles.emptyChat, { color: colors.textSecondary }]}>
                Nenhuma mensagem ainda. Diga oi!
              </Text>
            }
          />
        )}

        {/* Input bar */}
        <View
          style={[
            styles.inputBar,
            {
              backgroundColor: colors.background,
              borderTopColor: colors.border,
              paddingBottom: insets.bottom + 8,
            },
          ]}
        >
          <TextInput
            style={[
              styles.textInput,
              {
                backgroundColor: colors.card,
                color: colors.text,
                borderColor: colors.border,
              },
            ]}
            placeholder="Mensagem..."
            placeholderTextColor={colors.textSecondary}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={1000}
            returnKeyType="send"
            onSubmitEditing={handleSend}
            blurOnSubmit={false}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              { backgroundColor: inputText.trim() ? colors.primary : colors.border },
            ]}
            onPress={handleSend}
            disabled={!inputText.trim() || isSending}
          >
            <Ionicons
              name="send"
              size={20}
              color={inputText.trim() ? colors.onPrimary : colors.textSecondary}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  backButton: {
    padding: 6,
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 4,
  },
  headerName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  unmatchButton: {
    padding: 6,
  },
  loadingState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageList: {
    paddingTop: 16,
    paddingBottom: 8,
    gap: 8,
    flexGrow: 1,
  },
  emptyChat: {
    textAlign: 'center',
    marginTop: 64,
    fontSize: 14,
  },
  messageBubbleWrapper: {
    maxWidth: '80%',
  },
  ownWrapper: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  otherWrapper: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  bubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  ownBubble: {
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    borderBottomLeftRadius: 4,
  },
  failedBubble: {
    opacity: 0.6,
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 20,
  },
  pendingText: {
    opacity: 0.7,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    paddingHorizontal: 4,
  },
  retryText: {
    fontSize: 11,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  textInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    fontSize: 15,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
