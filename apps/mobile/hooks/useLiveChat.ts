import { useEffect } from 'react';
import { getSocket } from '@services/socket';
import type { Message } from '@/types';

interface RawMessage {
  id: string;
  jobId: string;
  senderId: string;
  content?: string | null;
  mediaUrl?: string | null;
  mediaType?: string | null;
  isRead: boolean;
  createdAt: string;
  sender?: { name?: string } | null;
}

function parseMessage(raw: RawMessage): Message {
  return {
    id: raw.id,
    jobId: raw.jobId,
    senderId: raw.senderId,
    senderName: raw.sender?.name ?? '',
    content: raw.content ?? undefined,
    mediaUrl: raw.mediaUrl ?? undefined,
    mediaType: raw.mediaType as Message['mediaType'] ?? undefined,
    isRead: raw.isRead,
    createdAt: raw.createdAt,
  };
}

/**
 * Subscribes to live chat messages via Socket.IO /chat namespace.
 * Only calls onMessage for messages from OTHER users (our own sent messages
 * are already added from the HTTP sendMessage response to avoid duplicates).
 */
export function useLiveChat(
  jobId: string | undefined,
  currentUserId: string | undefined,
  onMessage: (msg: Message) => void,
) {
  useEffect(() => {
    if (!jobId) return;

    const socket = getSocket('/chat');
    socket.connect();
    socket.emit('chat:subscribe', { jobId });

    const handleMessage = (raw: RawMessage) => {
      if (raw.senderId === currentUserId) return;
      onMessage(parseMessage(raw));
    };

    socket.on('chat:message', handleMessage);

    return () => {
      socket.off('chat:message', handleMessage);
      socket.emit('chat:unsubscribe', { jobId });
    };
  }, [jobId, currentUserId]);
}
