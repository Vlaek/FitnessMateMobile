import type { PropsWithChildren } from 'react';
import {
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppTheme } from '@/shared/theme/use-app-theme';

type Props = PropsWithChildren<{
  scroll?: boolean;
  bottomInset?: 'safeArea' | 'tabBar';
  keyboardAware?: boolean;
  contentStyle?: ViewStyle;
}>;

export function Screen({
  children,
  scroll = false,
  bottomInset = 'safeArea',
  keyboardAware = false,
  contentStyle,
}: Props) {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const isIOS = process.env.EXPO_OS === 'ios';
  const insetStyle = {
    paddingTop: insets.top,
    paddingBottom: bottomInset === 'safeArea' ? insets.bottom : 0,
    paddingLeft: insets.left,
    paddingRight: insets.right,
    backgroundColor: colors.background,
  };

  const body = scroll ? (
    <ScrollView
      automaticallyAdjustKeyboardInsets={keyboardAware}
      contentInsetAdjustmentBehavior="automatic"
      keyboardDismissMode={isIOS ? 'interactive' : 'on-drag'}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={[
        styles.scrollContent,
        keyboardAware && styles.keyboardScrollContent,
        contentStyle,
      ]}
      testID="screen-scroll"
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.content, contentStyle]}>{children}</View>
  );

  if (!keyboardAware) {
    return (
      <View testID="screen-root" style={[styles.root, insetStyle]}>
        {body}
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      testID="screen-root"
      enabled
      behavior={isIOS ? 'padding' : undefined}
      style={[styles.root, insetStyle]}
    >
      {body}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { flex: 1 },
  scrollContent: { flexGrow: 1, padding: 20, paddingBottom: 32 },
  keyboardScrollContent: { paddingBottom: 120 },
});
