import React, { useState } from 'react';
import { BlurTargetView } from 'expo-blur';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
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
import { PressFeedback } from './PressFeedback';
const light = {
  bg: '#FAF7F2',
  surface: '#FFFFFF',
  tint: '#E7EDE5',
  text: '#263C32',
  muted: '#58645C',
  primary: '#284F3E',
  onPrimary: '#FFFFFF',
  line: '#E6E5DD',
  danger: '#AB2634',
  dangerBg: '#FCEEF0',
  accent: '#F1BE9B',
  accentText: '#543727',
  water: '#267B8D',
  waterTint: '#E5F2F2',
  protein: '#437F97',
  carbs: '#907445',
  fat: '#94608D',
  energy: '#A6533B',
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
  accent: '#DAA781',
  accentText: '#30231A',
  water: '#92CDD8',
  waterTint: '#21383A',
  protein: '#92C9DD',
  carbs: '#DABD84',
  fat: '#D5A4D2',
  energy: '#EEAA8B',
};
export const fonts = {
  body: 'Manrope_400Regular',
  medium: 'Manrope_600SemiBold',
  bold: 'Manrope_700Bold',
  display: 'Manrope_800ExtraBold',
};
export function useTheme() {
  return useColorScheme() === 'dark' ? dark : light;
}
export function Page({
  children,
  footer,
  footerInset = true,
  footerFullWidth = false,
  footerOverlay = false,
  blurTarget,
}: {
  children: React.ReactNode;
  footer?: React.ReactNode;
  footerInset?: boolean;
  footerFullWidth?: boolean;
  footerOverlay?: boolean;
  blurTarget?: React.RefObject<View | null>;
}) {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const [footerHeight, setFooterHeight] = useState(0);
  const content = (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={[
        styles.page,
        {
          paddingBottom:
            Math.max(32, insets.bottom + 20) +
            (footerOverlay ? footerHeight : 0),
        },
      ]}
    >
      <View style={styles.content}>{children}</View>
    </ScrollView>
  );
  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {blurTarget && Platform.OS !== 'android' ? (
        <BlurTargetView
          ref={blurTarget}
          style={{ flex: 1, backgroundColor: colors.bg }}
        >
          {content}
        </BlurTargetView>
      ) : (
        content
      )}
      {footer && (
        <View
          onLayout={(event) => {
            if (footerOverlay) setFooterHeight(event.nativeEvent.layout.height);
          }}
          style={{
            ...(footerOverlay
              ? ({
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                } as const)
              : {}),
            paddingHorizontal: footerFullWidth ? 0 : 24,
            paddingTop: footerFullWidth ? 0 : 8,
            paddingBottom: footerFullWidth
              ? 0
              : footerInset
                ? Math.max(12, insets.bottom)
                : 12,
            backgroundColor: footerOverlay ? 'transparent' : colors.bg,
          }}
        >
          {footerFullWidth ? (
            footer
          ) : (
            <View style={styles.content}>{footer}</View>
          )}
        </View>
      )}
    </KeyboardAvoidingView>
  );
}
export function Label({
  children,
  large = false,
  compact = false,
}: {
  children: React.ReactNode;
  large?: boolean;
  compact?: boolean;
}) {
  const colors = useTheme();
  return (
    <Text
      style={{
        color: colors.text,
        fontSize: large ? 30 : 19,
        fontFamily: fonts.bold,
        fontWeight: '700',
        marginTop: compact ? 0 : 28,
        marginBottom: compact ? 0 : 16,
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
        fontSize: 15,
        fontFamily: fonts.body,
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
  compact = false,
  leading,
  accessibilityLabel,
  expanded,
}: {
  title: string;
  onPress: () => void;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  secondary?: boolean;
  danger?: boolean;
  disabled?: boolean;
  loading?: boolean;
  compact?: boolean;
  leading?: React.ReactNode;
  accessibilityLabel?: string;
  expanded?: boolean;
}) {
  const colors = useTheme();
  const foreground = danger
    ? colors.danger
    : secondary
      ? colors.primary
      : colors.onPrimary;
  return (
    <PressFeedback
      haptic="press"
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{
        disabled: disabled || loading,
        busy: loading,
        expanded,
      }}
      disabled={disabled || loading}
      onPress={() => {
        onPress();
      }}
      style={({ pressed }) => [
        styles.button,
        compact && { paddingHorizontal: 10, gap: 6, minHeight: 56 },
        {
          backgroundColor: danger
            ? colors.dangerBg
            : secondary
              ? colors.tint
              : colors.primary,
          opacity: disabled || loading ? 0.55 : pressed ? 0.92 : 1,
        },
      ]}
    >
      {!loading && leading}
      {loading ? (
        <ActivityIndicator color={foreground} />
      ) : icon ? (
        <Ionicons name={icon} size={21} color={foreground} />
      ) : null}
      <Text
        style={{
          color: foreground,
          fontSize: compact ? 14 : 16,
          fontWeight: '600',
          fontFamily: fonts.bold,
          flexShrink: 1,
          textAlign: 'center',
        }}
      >
        {title}
      </Text>
    </PressFeedback>
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
    <PressFeedback
      haptic="press"
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={() => {
        onPress();
      }}
      style={({ pressed }) => ({
        minWidth: 48,
        minHeight: 48,
        justifyContent: 'center',
        alignItems: 'center',
        opacity: disabled ? 0.4 : pressed ? 0.85 : 1,
      })}
    >
      <Ionicons name={icon} size={23} color={colors.primary} />
    </PressFeedback>
  );
}
export function Field({ label, ...props }: TextInputProps & { label: string }) {
  const colors = useTheme();
  return (
    <View style={{ flexGrow: 1, flexShrink: 1, minWidth: 0, marginBottom: 16 }}>
      <Text
        style={{
          color: colors.muted,
          fontSize: 13,
          fontFamily: fonts.medium,
          marginBottom: 8,
        }}
      >
        {label}
      </Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={colors.muted}
        selectionColor={colors.primary}
        {...props}
        style={[
          styles.input,
          { minWidth: 0, width: '100%' },
          { fontFamily: fonts.medium },
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
  value: { [Key in keyof Nutrients]: number | null };
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
                fontFamily: fonts.bold,
                fontWeight: '600',
                fontVariant: ['tabular-nums'],
              }}
            >
              {value[key] == null || !Number.isFinite(value[key])
                ? t.unknown
                : key === 'kcal'
                  ? `${Math.round(value[key]!)} ${t.kcal}`
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
    fontFamily: fonts.medium,
  },
});
