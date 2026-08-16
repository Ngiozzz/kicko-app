import { ReactNode } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius } from '@kicko/shared';

// Matches Kicko/docs' .modal-overlay/.modal-card slide-in drawer pattern
// (right-pinned panel, full height) — used by the Managers invite flow,
// and reusable once Bookings/Payments have real records to show.
export function Drawer({
  visible,
  onClose,
  title,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        {/* eslint-disable-next-line react/jsx-no-bind */}
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <ScrollView contentContainerStyle={styles.cardInner}>
            <View style={styles.head}>
              <Text style={styles.title}>{title}</Text>
              <Pressable onPress={onClose} style={styles.closeBtn}>
                <Text style={styles.closeText}>✕</Text>
              </Pressable>
            </View>
            {children}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, flexDirection: 'row', justifyContent: 'flex-end', backgroundColor: 'rgba(20,18,14,0.5)' },
  card: { width: 460, maxWidth: '92%', backgroundColor: colors.surface, height: '100%' } as any,
  cardInner: { padding: 28 },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 },
  title: { fontFamily: fonts.serifMedium, fontSize: 18, color: colors.text, flex: 1 },
  closeBtn: { padding: 2 },
  closeText: { fontSize: 20, color: colors.textSoft },
});
