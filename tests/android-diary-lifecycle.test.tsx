import React from 'react';
import { Platform } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { Page } from '../src/components/ui';
import { MacroDock } from '../src/components/MacroDock';
import { en } from '../src/core/i18n';

jest.mock('../src/state/AppProvider', () => ({
  useApp: () => ({
    settings: { goal: 2000 },
    t: require('../src/core/i18n').en,
  }),
}));
jest.mock('@expo/vector-icons/Ionicons', () => 'Icon');
jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0 }),
}));
jest.mock('expo-blur', () => ({
  BlurView: () => {
    throw new Error('Native blur must not mount during Android diary updates');
  },
  BlurTargetView: () => {
    throw new Error('Native blur capture must not wrap Android diary');
  },
}));
jest.mock('../src/components/ProgressTrack', () => ({
  ProgressTrack: () => null,
}));

test('repeated saved-meal updates render Android diary without native blur capture', async () => {
  const previous = Platform.OS;
  Object.defineProperty(Platform, 'OS', {
    configurable: true,
    value: 'android',
  });
  try {
    const target = React.createRef<import('react-native').View>();
    function DiarySnapshot({ kcal }: { kcal: number }) {
      return (
        <Page
          blurTarget={target}
          footerOverlay
          footerFullWidth
          footer={
            <MacroDock
              day="2026-10-06"
              value={{
                kcal,
                protein: 0,
                fat: 0,
                carbs: 0,
                salt: null,
                fiber: null,
                saturatedFat: null,
                sugars: null,
              }}
              blurTarget={target}
            />
          }
        >
          {null}
        </Page>
      );
    }
    const view = await render(<DiarySnapshot kcal={0} />);
    for (let i = 1; i <= 20; i++) {
      await view.rerender(<DiarySnapshot kcal={i * 100} />);
      expect(
        screen.getByLabelText(en.nutritionDetails).props.accessibilityHint,
      ).toContain(`${i * 100}`);
    }
  } finally {
    Object.defineProperty(Platform, 'OS', {
      configurable: true,
      value: previous,
    });
  }
});
