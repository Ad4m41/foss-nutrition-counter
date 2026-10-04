import React from 'react';
import { View } from 'react-native';
import { useApp } from '../state/AppProvider';
import { Button } from './ui';

export function PhotoActions({
  disabled,
  onCamera,
  onGallery,
}: {
  disabled: boolean;
  onCamera: () => void;
  onGallery: () => void;
}) {
  const { t } = useApp();
  return (
    <View
      style={{
        flexDirection: 'row',
        gap: 12,
        width: '100%',
        alignItems: 'stretch',
      }}
    >
      <View style={{ flex: 1, minWidth: 0 }}>
        <Button
          compact
          title={t.camera}
          icon="camera-outline"
          secondary
          disabled={disabled}
          onPress={onCamera}
        />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Button
          compact
          title={t.gallery}
          icon="images-outline"
          secondary
          disabled={disabled}
          onPress={onGallery}
        />
      </View>
    </View>
  );
}
