import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View, type KeyboardTypeOptions, type TextStyle, type ViewStyle } from 'react-native';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

export function useThemeColors() {
  return Colors[useColorScheme()];
}

export function Screen({ children, scroll = true }: { children: ReactNode; scroll?: boolean }) {
  const c = useThemeColors();
  const style = [styles.screen, { backgroundColor: c.background }];
  return scroll ? (
    <ScrollView style={style} contentContainerStyle={styles.screenContent} keyboardShouldPersistTaps="handled">
      {children}
    </ScrollView>
  ) : (
    <View style={[style, styles.screenContent]}>{children}</View>
  );
}

export function Title({ children }: { children: ReactNode }) {
  const c = useThemeColors();
  return <Text style={[styles.title, { color: c.text }]}>{children}</Text>;
}

export function Body({ children, muted, style }: { children: ReactNode; muted?: boolean; style?: TextStyle }) {
  const c = useThemeColors();
  return <Text style={[styles.body, { color: muted ? c.muted : c.text }, style]}>{children}</Text>;
}

export function ErrorText({ children }: { children: ReactNode }) {
  const c = useThemeColors();
  return <Text style={[styles.error, { color: c.danger }]}>{children}</Text>;
}

export function Field(props: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  error?: string;
  keyboardType?: KeyboardTypeOptions;
  placeholder?: string;
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'sentences';
}) {
  const c = useThemeColors();
  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: c.muted }]}>{props.label}</Text>
      <TextInput
        accessibilityLabel={props.label}
        value={props.value}
        onChangeText={props.onChangeText}
        keyboardType={props.keyboardType}
        placeholder={props.placeholder}
        placeholderTextColor={c.muted}
        secureTextEntry={props.secureTextEntry}
        autoCapitalize={props.autoCapitalize}
        style={[styles.input, { color: c.text, borderColor: props.error ? c.danger : c.border, backgroundColor: c.card }]}
      />
      {props.error ? <ErrorText>{props.error}</ErrorText> : null}
    </View>
  );
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled,
  style,
}: {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  style?: ViewStyle;
}) {
  const c = useThemeColors();
  const bg = variant === 'primary' ? c.tint : 'transparent';
  const fg = variant === 'primary' ? c.onTint : variant === 'danger' ? c.danger : c.tint;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [styles.button, { backgroundColor: bg, borderColor: variant === 'primary' ? c.tint : fg, opacity: pressed || disabled ? 0.6 : 1 }, style]}>
      <Text style={[styles.buttonText, { color: fg }]}>{title}</Text>
    </Pressable>
  );
}

export function Chip({ label, selected, onPress, color }: { label: string; selected: boolean; onPress: () => void; color?: string }) {
  const c = useThemeColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.chip, { borderColor: selected ? c.tint : c.border, borderWidth: selected ? 2 : 1, backgroundColor: color ?? (selected ? c.tint : c.card) }]}>
      <Text style={{ color: color ? '#FFFFFF' : selected ? c.onTint : c.text, fontWeight: selected ? '600' : '400' }}>{label}</Text>
    </Pressable>
  );
}

export function Row({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[styles.row, style]}>{children}</View>;
}

export function Card({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  const c = useThemeColors();
  return <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  screenContent: { padding: 16, gap: 12 },
  title: { fontSize: 20, fontWeight: '700' },
  body: { fontSize: 16 },
  field: { gap: 4 },
  label: { fontSize: 14 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16 },
  error: { fontSize: 13 },
  button: { borderWidth: 1, borderRadius: 10, paddingVertical: 12, paddingHorizontal: 16, alignItems: 'center', minHeight: 48, justifyContent: 'center' },
  buttonText: { fontSize: 16, fontWeight: '600' },
  chip: { borderRadius: 999, paddingVertical: 8, paddingHorizontal: 14, minHeight: 40, minWidth: 40, justifyContent: 'center', alignItems: 'center' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  card: { borderWidth: 1, borderRadius: 12, padding: 14, gap: 8 },
});
