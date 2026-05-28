import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Pressable, FlatList, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput } from '@components/ui/TextInput';
import { Text } from '@components/ui/Text';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColors, ColorPalette, Typography, Spacing, Radius, Components } from '@constants/theme';
import { Avatar } from '@components/ui/Avatar';
import { ImgBox } from '@components/ui/ImgBox';
import { getMessages, sendMessage, getJobById } from '@services';
import { useAuthStore } from '@store/auth.store';
import { useLiveChat } from '@hooks/useLiveChat';
import type { Message, Job } from '@/types';

function formatTime(isoString: string): string {
  const d = new Date(isoString);
  return d.toLocaleTimeString('en-ZW', { hour: '2-digit', minute: '2-digit' });
}

export default function ChatScreen() {
  const router = useRouter();
  const { jobId } = useLocalSearchParams<{ jobId: string }>();
  const currentUser = useAuthStore((s) => s.user);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [job, setJob] = useState<Job | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const C = useColors();
  const styles = useMemo(() => getStyles(C), [C]);

  useEffect(() => {
    if (!jobId) return;
    Promise.all([getMessages(jobId), getJobById(jobId)])
      .then(([msgs, j]) => { setMessages(msgs); setJob(j); })
      .catch(() => {});
  }, [jobId]);

  useLiveChat(jobId, currentUser?.id, (msg) => {
    setMessages((prev) => {
      if (prev.some((m) => m.id === msg.id)) return prev;
      return [...prev, msg];
    });
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  });

  const otherPartyName = useMemo(() => {
    if (job) {
      if (currentUser?.role === 'DRIVER') return job.shipperName || '—';
      return job.matchedDriverName || messages.find((m) => m.senderId !== currentUser?.id)?.senderName || '—';
    }
    return messages.find((m) => m.senderId !== currentUser?.id)?.senderName ?? '—';
  }, [job, messages, currentUser]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || !jobId) return;
    setInput('');
    try {
      const msg = await sendMessage(jobId, text);
      setMessages((prev) => [...prev, msg]);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    } catch {
      // message failed — keep input cleared, user can retry by typing again
    }
  };

  const subtitle = job
    ? `${job.originAddress.split(',')[0]} → ${job.destAddress.split(',')[0]}`
    : '—';

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.appbar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={C.text.primary} />
        </Pressable>
        <View style={styles.appbarCenter}>
          <Avatar name={otherPartyName} size={32} />
          <View>
            <Text style={styles.chatTitle}>{otherPartyName}</Text>
            <Text style={styles.chatSub}>{subtitle}</Text>
          </View>
        </View>
        <View style={{ width: 44 }} />
      </View>

      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          renderItem={({ item }) => {
            const isMe = item.senderId === currentUser?.id;
            return (
              <View style={[styles.messageRow, isMe && styles.messageRowMe]}>
                {!isMe && <Avatar name={item.senderName} size={28} />}
                <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
                  {item.mediaType === 'image' ? (
                    <ImgBox width={200} height={140} borderRadius={8} label="image" />
                  ) : (
                    <Text style={[styles.messageText, isMe && styles.messageTextMe]}>
                      {item.content}
                    </Text>
                  )}
                  <Text style={[styles.messageTime, !isMe && { color: C.text.tertiary }]}>{formatTime(item.createdAt)}</Text>
                </View>
              </View>
            );
          }}
        />

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Type a message…"
            placeholderTextColor={C.text.tertiary}
            multiline
          />
          <Pressable
            style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!input.trim()}
          >
            <Ionicons name="send" size={18} color={C.background.primary} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function getStyles(C: ColorPalette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: C.background.primary },
    appbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.screenH, height: 56, borderBottomWidth: 1, borderBottomColor: C.background.divider },
    backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    appbarCenter: { flexDirection: 'row', alignItems: 'center', gap: Spacing.gapSm },
    chatTitle: { fontSize: Typography.sizes.label, fontWeight: Typography.weights.semibold, color: C.text.primary },
    chatSub: { fontSize: Typography.sizes.micro, color: C.text.secondary },
    kav: { flex: 1 },
    messageList: { padding: Spacing.screenH, gap: Spacing.gap },
    messageRow: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.gapSm },
    messageRowMe: { flexDirection: 'row-reverse' },
    bubble: { maxWidth: '75%', borderRadius: Radius.card, padding: 10, gap: 4 },
    bubbleMe: { backgroundColor: C.accent },
    bubbleThem: { backgroundColor: C.background.card, borderWidth: 1, borderColor: C.background.divider },
    messageText: { fontSize: Typography.sizes.label, color: C.text.primary, lineHeight: 20 },
    messageTextMe: { color: C.background.primary },
    messageTime: { fontSize: Typography.sizes.micro, color: 'rgba(255,255,255,0.6)', fontVariant: ['tabular-nums'], alignSelf: 'flex-end' },
    inputRow: { flexDirection: 'row', alignItems: 'flex-end', padding: Spacing.screenH, gap: Spacing.gapSm, borderTopWidth: 1, borderTopColor: C.background.divider },
    input: { flex: 1, backgroundColor: C.background.elevated, borderRadius: Radius.button, borderWidth: 1, borderColor: C.background.divider, paddingHorizontal: 14, paddingVertical: 10, color: C.text.primary, fontSize: Typography.sizes.label, maxHeight: 100 },
    sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center' },
    sendBtnDisabled: { opacity: 0.4 },
  });
}
