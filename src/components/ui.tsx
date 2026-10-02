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
import {
  Nutrients,
  nutrientKeys,
  additionalNutrientKeys,
} from '../core/nutrition';
import { useApp } from '../state/AppProvider';
const light = {
  bg: '#F5F6F3',
  surface: '#FFFFFF',
  tint: '#E6EFE8',
  text: '#202922',
  muted: '#58645C',
  primary: '#216C50',
  onPrimary: '#FFFFFF',
  line: '#DFE4DE',
  danger: '#AB2634',
  dangerBg: '#FCEEF0',
};
const dark: typeof light = {
  bg: '#151C18',
  surface: '#202A23',
  tint: '#2A3C30',
  text: '#F1F5EF',
  muted: '#B8C6BA',
  primary: '#A3D8B7',
  onPrimary: '#163A27',
  line: '#3C4B3F',
  danger: '#FFB0B9',
  dangerBg: '#432832',
};
export function useTheme() {
  return useColorScheme() === 'dark' ? dark : light;
}
export function Page({
  children,
  footer,
}: {
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
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
      {footer && (
        <View
          style={{
            paddingHorizontal: 24,
            paddingTop: 8,
            paddingBottom: Math.max(12, insets.bottom),
            backgroundColor: colors.bg,
          }}
        >
          <View style={styles.content}>{footer}</View>
        </View>
      )}
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
        fontSize: large ? 28 : 19,
        fontWeight: '700',
        marginTop: 28,
        marginBottom: 16,
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
    <View style={{ flexGrow: 1, marginBottom: 16 }}>
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
    <View style={{ gap: 12, marginVertical: 0 }}>
      {heading && (
        <Text style={{ color: colors.text, fontSize: 19, fontWeight: '600' }}>
          {heading}
        </Text>
      )}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: 16 }}>
        {nutrientKeys.map((key, index) => (
          <View
            key={key}
            style={{
              flexBasis: '45%',
              flexGrow: 1,
              paddingVertical: 6,
              borderBottomWidth: index < 6 ? 1 : 0,
              borderBottomColor: colors.line,
            }}
          >
            <Text
              style={{ color: colors.muted, fontSize: 12, marginBottom: 4 }}
            >
              {t[key]}
            </Text>
            <Text
              style={{
                color: colors.text,
                fontSize: index < 4 ? 21 : 16,
                fontWeight: '600',
                fontVariant: ['tabular-nums'],
              }}
            >
              {value[key] == null || !Number.isFinite(value[key])
                ? t.unknown
                : key === 'kcal'
                  ? `${Math.round(value.kcal)} ${t.kcal}`
                  : `${Math.round(value[key]! * (key === 'salt' ? 100 : 10)) / (key === 'salt' ? 100 : 10)} g`}
            </Text>
          </View>
        ))}
      </View>
      {additionalNutrientKeys.some((key) => value[key] == null) && (
        <Body muted>{t.incompleteNutrition}</Body>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  page: { flexGrow: 1, padding: 24 },
  content: { width: '100%', maxWidth: 560, alignSelf: 'center' },
  button: {
    minHeight: 52,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 12,
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
