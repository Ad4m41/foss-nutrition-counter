import React from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  useColorScheme,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Nutrients } from '../core/nutrition';
import { useApp } from '../state/AppProvider';
const light = {
  bg: '#F4F8FC',
  surface: '#FFFFFF',
  tint: '#E1EEFA',
  text: '#172F47',
  muted: '#4A647B',
  primary: '#175CB0',
  onPrimary: '#FFFFFF',
  line: '#CBDAE8',
  danger: '#AB2634',
  dangerBg: '#FCEEF0',
};
const dark: typeof light = {
  bg: '#101E2C',
  surface: '#182C3F',
  tint: '#213F59',
  text: '#EFF6FF',
  muted: '#B0C6D9',
  primary: '#9AC6FF',
  onPrimary: '#102E54',
  line: '#3B5369',
  danger: '#FFB0B9',
  dangerBg: '#432832',
};
export function useTheme() {
  return useColorScheme() === 'dark' ? dark : light;
}
export function Page({ children }: { children: React.ReactNode }) {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.page,
          { paddingBottom: Math.max(32, insets.bottom + 20) },
        ]}
      >
        <View style={styles.content}>{children}</View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
export function Label({
  children,
  large = false,
}: {
  children: React.ReactNode;
  large?: boolean;
}) {
  const colors = useTheme();
  return (
    <Text
      style={{
        color: colors.text,
        fontSize: large ? 26 : 19,
        fontWeight: '700',
        marginTop: 20,
        marginBottom: 12,
      }}
    >
      {children}
    </Text>
  );
}
export function Body({
  children,
  muted = false,
}: {
  children: React.ReactNode;
  muted?: boolean;
}) {
  const colors = useTheme();
  return (
    <Text
      style={{
        color: muted ? colors.muted : colors.text,
        fontSize: 16,
        lineHeight: 24,
      }}
    >
      {children}
    </Text>
  );
}
export function Button({
  title,
  onPress,
  icon,
  secondary = false,
  danger = false,
  disabled = false,
  loading = false,
}: {
  title: string;
  onPress: () => void;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  secondary?: boolean;
  danger?: boolean;
  disabled?: boolean;
  loading?: boolean;
}) {
  const colors = useTheme();
  const foreground = danger
    ? colors.danger
    : secondary
      ? colors.primary
      : colors.onPrimary;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: danger
            ? colors.dangerBg
            : secondary
              ? colors.tint
              : colors.primary,
          opacity: disabled || loading ? 0.55 : pressed ? 0.8 : 1,
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={foreground} />
      ) : icon ? (
        <Ionicons name={icon} size={21} color={foreground} />
      ) : null}
      <Text
        style={{
          color: foreground,
          fontSize: 16,
          fontWeight: '600',
          flexShrink: 1,
          textAlign: 'center',
        }}
      >
        {title}
      </Text>
    </Pressable>
  );
}
export function IconButton({
  label,
  icon,
  onPress,
  disabled,
}: {
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  onPress: () => void;
  disabled?: boolean;
}) {
  const colors = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        minWidth: 48,
        minHeight: 48,
        justifyContent: 'center',
        alignItems: 'center',
        opacity: disabled ? 0.4 : pressed ? 0.6 : 1,
      })}
    >
      <Ionicons name={icon} size={23} color={colors.primary} />
    </Pressable>
  );
}
export function Field({ label, ...props }: TextInputProps & { label: string }) {
  const colors = useTheme();
  return (
    <View style={{ flexGrow: 1, flexBasis: 100, marginBottom: 12 }}>
      <Text style={{ color: colors.muted, fontSize: 14, marginBottom: 6 }}>
        {label}
      </Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={colors.muted}
        selectionColor={colors.primary}
        {...props}
        style={[
          styles.input,
          {
            color: colors.text,
            backgroundColor: colors.surface,
            borderColor: colors.line,
          },
          props.style,
        ]}
      />
    </View>
  );
}
export function Notice({
  text,
  error = false,
}: {
  text: string;
  error?: boolean;
}) {
  const colors = useTheme();
  return (
    <View
      accessibilityRole={error ? 'alert' : undefined}
      accessibilityLiveRegion="polite"
      style={{
        backgroundColor: error ? colors.dangerBg : colors.tint,
        padding: 16,
        borderRadius: 12,
        marginVertical: 12,
      }}
    >
      <Text
        style={{
          color: error ? colors.danger : colors.text,
          fontSize: 15,
          lineHeight: 22,
        }}
      >
        {text}
      </Text>
    </View>
  );
}
export function Nutrition({
  value,
  heading,
}: {
  value: Nutrients;
  heading?: string;
}) {
  const { t } = useApp();
  const colors = useTheme();
  return (
    <View style={{ gap: 10, marginVertical: 14 }}>
      {heading && (
        <Text style={{ color: colors.muted, fontSize: 15 }}>{heading}</Text>
      )}
      <Text
        style={{
          color: colors.text,
          fontSize: 32,
          fontWeight: '700',
          fontVariant: ['tabular-nums'],
        }}
      >
        {Math.round(value.kcal)}{' '}
        <Text style={{ fontSize: 17, fontWeight: '400' }}>{t.kcal}</Text>
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 20 }}>
        {(['protein', 'fat', 'carbs'] as const).map((key) => (
          <View key={key} style={{ minWidth: 70 }}>
            <Text style={{ color: colors.muted, fontSize: 14 }}>{t[key]}</Text>
            <Text
              style={{
                color: colors.text,
                fontSize: 17,
                fontWeight: '600',
                fontVariant: ['tabular-nums'],
              }}
            >
              {Math.round(value[key] * 10) / 10} g
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  page: { flexGrow: 1, padding: 20 },
  content: { width: '100%', maxWidth: 640, alignSelf: 'center' },
  button: {
    minHeight: 52,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    marginVertical: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    minHeight: 50,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
});
