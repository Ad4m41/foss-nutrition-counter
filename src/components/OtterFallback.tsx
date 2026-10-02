import React from 'react';
import { Image } from 'react-native';
import type { OtterState } from '../core/otter';
export type OtterProps = OtterState;
export function OtterFallback() {
  return (
    <Image
      source={require('../../assets/otter/otter.png')}
      style={{ width: 100, height: 106 }}
      resizeMode="contain"
      accessible={false}
    />
  );
}
