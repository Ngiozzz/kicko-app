import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '@kicko/shared';
import { RoleFaq } from '../content/roleContent';

const TRANSITION = { transitionProperty: 'all', transitionDuration: '160ms', transitionTimingFunction: 'ease' } as const;

export function FaqAccordion({ faqs }: { faqs: RoleFaq[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <View style={styles.list}>
      {faqs.map((item, i) => {
        const open = openIndex === i;
        return (
          <View key={item.q} style={styles.item}>
            <Pressable onPress={() => setOpenIndex(open ? null : i)} style={styles.question}>
              <Text style={styles.questionText}>{item.q}</Text>
              <Text style={[styles.icon, open && styles.iconOpen]}>+</Text>
            </Pressable>
            {open && (
              <View style={styles.answer}>
                <Text style={styles.answerText}>{item.a}</Text>
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: 0 },
  item: { borderBottomWidth: 1, borderBottomColor: colors.border },
  question: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 20,
    gap: 16,
  },
  questionText: { flex: 1, fontFamily: fonts.sansSemiBold, fontSize: 15.5, color: colors.text },
  icon: { fontFamily: fonts.sansMedium, fontSize: 20, color: colors.accent, ...TRANSITION, transform: [{ rotate: '0deg' }] },
  iconOpen: { transform: [{ rotate: '45deg' }] },
  answer: { paddingBottom: 20, paddingRight: 32 },
  answerText: { fontFamily: fonts.sans, fontSize: 14.5, lineHeight: 22, color: colors.textSoft },
});
