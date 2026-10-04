import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

let lastFeedback = -Infinity;
/** Short, rate-limited feedback. Haptic availability never blocks an action. */
export function feedback(kind: 'press' | 'selection' = 'selection') {
  if (Platform.OS === 'web') return;
  const now = Date.now();
  if (now - lastFeedback < 80) return;
  lastFeedback = now;
  try {
    const request =
      kind === 'press'
        ? Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
        : Haptics.selectionAsync();
    void request.catch(() => {});
  } catch {
    // Unsupported runtimes must retain the original interaction.
  }
}
