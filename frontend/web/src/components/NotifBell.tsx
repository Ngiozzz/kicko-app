import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { colors, fonts, radius } from '@kicko/shared';
import { notificationsApi, Notification } from '../lib/notificationsApi';
import { useClickOutside } from '../lib/useClickOutside';

function timeAgo(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

// Shared by every role shell (owner/admin/manager/player) — was four
// separate copies, each just a bell that always said "No notifications
// yet." Now backed by real data from notificationsApi (see
// backend/src/services/notifications.service.ts for where rows get
// created) and reused as-is everywhere instead of re-copied per shell.
export function NotifBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[] | null>(null);
  const ref = useClickOutside<HTMLDivElement>(open, () => setOpen(false));

  const load = useCallback(async () => {
    try {
      const { notifications } = await notificationsApi.list();
      setNotifications(notifications);
    } catch {
      // Silent — a broken notification fetch shouldn't block the rest of the shell.
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const unreadCount = notifications?.filter((n) => !n.read).length ?? 0;

  function handleToggle() {
    setOpen((o) => {
      if (!o) load(); // refresh right as it opens, so it's never stale from mount
      return !o;
    });
  }

  function handleSelect(n: Notification) {
    if (!n.read) {
      setNotifications((prev) => prev?.map((x) => (x.id === n.id ? { ...x, read: true } : x)) ?? null);
      notificationsApi.markRead(n.id).catch(() => {});
    }
    setOpen(false);
    if (n.link) router.push(n.link);
  }

  function handleMarkAllRead() {
    setNotifications((prev) => prev?.map((n) => ({ ...n, read: true })) ?? null);
    notificationsApi.markAllRead().catch(() => {});
  }

  return (
    <View ref={ref as any}>
      <Pressable onPress={handleToggle} style={styles.iconBtn}>
        <Text style={{ fontSize: 15 }}>🔔</Text>
        {unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
          </View>
        )}
      </Pressable>

      {open && (
        <View style={styles.preview}>
          <View style={styles.previewHead}>
            <Text style={styles.previewTitle}>Notifications</Text>
            {unreadCount > 0 && (
              <Pressable onPress={handleMarkAllRead}>
                <Text style={styles.markAllText}>Mark all read</Text>
              </Pressable>
            )}
          </View>

          {notifications === null && <Text style={styles.emptyText}>Loading…</Text>}
          {notifications && notifications.length === 0 && <Text style={styles.emptyText}>No notifications yet.</Text>}

          <ScrollView style={styles.list}>
            {notifications?.map((n) => (
              <Pressable key={n.id} onPress={() => handleSelect(n)} style={styles.row}>
                <View style={[styles.dot, !n.read && styles.dotUnread]} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.rowTitle}>{n.title}</Text>
                  {n.body ? (
                    <Text style={styles.rowBody} numberOfLines={2}>
                      {n.body}
                    </Text>
                  ) : null}
                  <Text style={styles.rowTime}>{timeAgo(n.created_at)}</Text>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -3,
    right: -3,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 3,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontFamily: fonts.sansBold, fontSize: 9.5, color: '#fff' },

  preview: {
    position: 'absolute',
    top: 46,
    right: 0,
    width: 320,
    maxHeight: 400,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: 16,
    zIndex: 55,
  },
  previewHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  previewTitle: { fontFamily: fonts.sansSemiBold, fontSize: 13.5, color: colors.text },
  markAllText: { fontFamily: fonts.sansMedium, fontSize: 11.5, color: colors.accent },
  emptyText: { fontFamily: fonts.sans, fontSize: 13, color: colors.textSoft, textAlign: 'center', paddingVertical: 12 },

  list: { maxHeight: 340 },
  row: { flexDirection: 'row', gap: 10, paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.border },
  dot: { width: 7, height: 7, borderRadius: 4, marginTop: 5, backgroundColor: 'transparent' },
  dotUnread: { backgroundColor: colors.accent },
  rowTitle: { fontFamily: fonts.sansSemiBold, fontSize: 12.5, color: colors.text },
  rowBody: { fontFamily: fonts.sans, fontSize: 11.5, color: colors.textSoft, marginTop: 2, lineHeight: 15 },
  rowTime: { fontFamily: fonts.sans, fontSize: 10.5, color: colors.textSoft, marginTop: 3 },
});
