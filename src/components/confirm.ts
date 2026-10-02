import { Alert, Platform } from 'react-native';
export function confirmAction(
  title: string,
  message: string,
  accept: string,
  cancel: string,
  destructive = false,
): Promise<boolean> {
  if (Platform.OS === 'web')
    return Promise.resolve(window.confirm(`${title}\n\n${message}`));
  return new Promise((resolve) =>
    Alert.alert(
      title,
      message,
      [
        { text: cancel, style: 'cancel', onPress: () => resolve(false) },
        {
          text: accept,
          style: destructive ? 'destructive' : 'default',
          onPress: () => resolve(true),
        },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    ),
  );
}
