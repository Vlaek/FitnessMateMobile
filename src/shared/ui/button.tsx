import { ActivityIndicator, Pressable, StyleSheet, Text, type PressableProps } from 'react-native';
import { useAppTheme } from '@/shared/theme/use-app-theme';

type TProps = PressableProps & {
  label: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  loading?: boolean;
};

export function Button({
  label,
  variant = 'primary',
  loading = false,
  disabled,
  style,
  ...props
}: TProps) {
  const { colors } = useAppTheme();
  const palette =
    variant === 'primary'
      ? { background: colors.primary, text: colors.primaryText, border: colors.primary }
      : variant === 'danger'
        ? { background: colors.danger, text: colors.dangerText, border: colors.danger }
        : variant === 'ghost'
          ? { background: 'transparent', text: colors.primary, border: 'transparent' }
          : { background: colors.surface, text: colors.text, border: colors.border };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled || loading}
      style={(state) => [
        styles.button,
        { backgroundColor: palette.background, borderColor: palette.border },
        (disabled || loading) && styles.disabled,
        state.pressed && styles.pressed,
        typeof style === 'function' ? style(state) : style,
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={palette.text} />
      ) : (
        <Text style={[styles.label, { color: palette.text }]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    paddingHorizontal: 18,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { fontSize: 16, fontWeight: '700' },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.8 },
});
