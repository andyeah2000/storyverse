import { useEffect, useCallback } from 'react';

type KeyCombo = {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  alt?: boolean;
};

/**
 * Custom hook for keyboard shortcuts
 * @param keyCombo - The key combination to listen for
 * @param callback - The function to call when shortcut is triggered
 * @param enabled - Whether the shortcut is enabled (default: true)
 */
export function useKeyboardShortcut(
  keyCombo: KeyCombo,
  callback: () => void,
  enabled: boolean = true
): void {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      const { key, ctrl, meta, shift, alt } = keyCombo;
      
      const keyMatch = event.key.toLowerCase() === key.toLowerCase();
      const ctrlMatch = ctrl ? event.ctrlKey : !event.ctrlKey;
      const metaMatch = meta ? event.metaKey : !event.metaKey;
      const shiftMatch = shift ? event.shiftKey : !event.shiftKey;
      const altMatch = alt ? event.altKey : !event.altKey;

      if (keyMatch && ctrlMatch && metaMatch && shiftMatch && altMatch) {
        event.preventDefault();
        callback();
      }
    },
    [keyCombo, callback, enabled]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

