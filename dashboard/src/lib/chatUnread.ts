import { useMemo } from 'react';
import { useCollectionDocs } from './db';
import { isChatUnread } from '../pages/ChatsPanel';

/** عدد المحادثات اللي فيها رسائل جديدة للأدمن — لشارة السايدبار. */
export function useChatUnread(): number {
  const chats = useCollectionDocs('chats');
  return useMemo(
    () =>
      chats.rows.filter((row) =>
        isChatUnread(row as { updatedAt?: unknown; lastReadByAdmin?: unknown }),
      ).length,
    [chats.rows],
  );
}
