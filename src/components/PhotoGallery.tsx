import React from 'react';
import { Image, View } from 'react-native';
import { useApp } from '../state/AppProvider';
import { IconButton } from './ui';

export function PhotoGallery({
  uris,
  label,
  onRemove,
  disabled = false,
}: {
  uris: string[];
  label: string;
  onRemove?: (uri: string) => void;
  disabled?: boolean;
}) {
  const { t } = useApp();
  return (
    <View
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: uris.length ? 16 : 0,
      }}
    >
      {uris.map((uri, index) => (
        <View
          key={uri}
          style={{ width: uris.length === 1 ? '100%' : '47%', flexGrow: 1 }}
        >
          <Image
            source={{ uri }}
            accessibilityLabel={index === 0 ? label : `${label} ${index + 1}`}
            style={{
              width: '100%',
              height: uris.length === 1 ? 220 : 140,
              borderRadius: 16,
            }}
            resizeMode="contain"
          />
          {onRemove && (
            <View style={{ position: 'absolute', top: 4, right: 4 }}>
              <IconButton
                label={`${t.removePhoto} ${index + 1}`}
                icon="close"
                disabled={disabled}
                onPress={() => onRemove(uri)}
              />
            </View>
          )}
        </View>
      ))}
    </View>
  );
}
