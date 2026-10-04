import React, { useRef, useState } from 'react';
import { Modal, Pressable, Switch, Text, View } from 'react-native';
import { Language } from '../core/nutrition';
import { useApp } from '../state/AppProvider';
import { Body, Button, Field, Notice, fonts, useTheme } from './ui';

const languages = [
  {
    code: 'pl' as const,
    name: 'Polski',
    flag: '🇵🇱',
    search: 'polski polish poland',
  },
  {
    code: 'en' as const,
    name: 'English',
    flag: '🇬🇧',
    search: 'english angielski',
  },
];

export function LanguageSelect({ disabled = false }: { disabled?: boolean }) {
  const { settings, updateSettings, t } = useApp();
  const colors = useTheme();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const lock = useRef(false);
  const selected = languages.find((item) => item.code === settings.language)!;
  async function change(language: Language, system = false) {
    if (lock.current || disabled) return;
    lock.current = true;
    setBusy(true);
    setError(false);
    try {
      await updateSettings({
        ...settings,
        language,
        languageMode: system ? 'system' : 'manual',
      });
      setOpen(false);
    } catch {
      setError(true);
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <View style={{ gap: 12 }}>
      <Button
        title={`${selected.flag} ${selected.name}`}
        icon="chevron-down"
        secondary
        disabled={disabled || busy}
        onPress={() => {
          setSearch('');
          setOpen(true);
        }}
      />
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <View style={{ flex: 1 }}>
          <Body>{t.systemLanguage}</Body>
        </View>
        <Switch
          accessibilityLabel={t.systemLanguage}
          value={settings.languageMode !== 'manual'}
          disabled={disabled || busy}
          onValueChange={(system) => {
            void change(settings.language, system);
          }}
          trackColor={{ true: colors.primary }}
        />
      </View>
      {error && <Notice error text={t.storageError} />}
      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            padding: 24,
            backgroundColor: '#00000066',
          }}
        >
          <View
            accessibilityViewIsModal
            style={{
              backgroundColor: colors.bg,
              padding: 20,
              borderRadius: 20,
              gap: 16,
            }}
          >
            <Body>{t.language}</Body>
            <Field
              label={t.searchLanguage}
              value={search}
              onChangeText={setSearch}
              autoCorrect={false}
            />
            {languages
              .filter((item) =>
                item.search.includes(search.trim().toLowerCase()),
              )
              .map((item) => (
                <Pressable
                  key={item.code}
                  accessibilityRole="button"
                  accessibilityLabel={item.name}
                  accessibilityState={{
                    selected: item.code === settings.language,
                    disabled: busy,
                  }}
                  disabled={busy}
                  onPress={() => {
                    void change(item.code);
                  }}
                  style={({ pressed }) => ({
                    minHeight: 52,
                    padding: 12,
                    borderRadius: 12,
                    backgroundColor:
                      item.code === settings.language
                        ? colors.tint
                        : colors.surface,
                    opacity: pressed ? 0.7 : 1,
                  })}
                >
                  <Text
                    style={{
                      fontFamily: fonts.bold,
                      color: colors.text,
                      fontSize: 17,
                    }}
                  >
                    {item.flag} {item.name}
                    {item.code === settings.language ? ' ✓' : ''}
                  </Text>
                </Pressable>
              ))}
            {!languages.some((item) =>
              item.search.includes(search.trim().toLowerCase()),
            ) && <Body muted>{t.noLanguages}</Body>}
            {error && <Notice error text={t.storageError} />}
            <Button title={t.cancel} secondary onPress={() => setOpen(false)} />
          </View>
        </View>
      </Modal>
    </View>
  );
}
