import React, { Component, useCallback, useEffect, useState } from 'react';
import { AccessibilityInfo, AppState } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { useFocusEffect } from 'expo-router';
import { OtterFallback, type OtterProps } from './OtterFallback';

class OtterBoundary extends Component<
  { children: React.ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? <OtterFallback /> : this.props.children;
  }
}
function RuntimeOtter(props: OtterProps) {
  // Do not initialize Nitro/Rive inside Expo Go, where its native code is absent.
  const { OtterRive } =
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- load native code only after the Expo Go guard
    require('./OtterRive.native') as typeof import('./OtterRive.native');
  return <OtterRive {...props} />;
}
export function OtterMascot(props: OtterProps) {
  const [focused, setFocused] = useState(false);
  const [active, setActive] = useState(AppState.currentState === 'active');
  const [reduceMotion, setReduceMotion] = useState(true);
  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      return () => setFocused(false);
    }, []),
  );
  useEffect(() => {
    let mounted = true;
    let motionChanged = false;
    void AccessibilityInfo.isReduceMotionEnabled()
      .then((value) => {
        if (mounted && !motionChanged) setReduceMotion(value);
      })
      .catch(() => {});
    const motion = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      (value) => {
        motionChanged = true;
        setReduceMotion(value);
      },
    );
    const app = AppState.addEventListener('change', (value) =>
      setActive(value === 'active'),
    );
    return () => {
      mounted = false;
      motion.remove();
      app.remove();
    };
  }, []);
  if (
    Constants.executionEnvironment === ExecutionEnvironment.StoreClient ||
    reduceMotion ||
    !active ||
    !focused
  )
    return <OtterFallback />;
  return (
    <OtterBoundary>
      <RuntimeOtter {...props} />
    </OtterBoundary>
  );
}
