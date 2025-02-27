import { useEffect, useCallback } from 'react';

type KeyOption = string | string[];
type KeyboardShortcutOptions = {
  metaKey?: boolean;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  preventDefault?: boolean;
};

/**
 * Hook for handling keyboard shortcuts
 * @param key Single key or array of keys that trigger the callback
 * @param callback Function to call when the key is pressed
 * @param options Options for modifiers and event handling
 */
export function useKeyboardShortcut(
  key: KeyOption,
  callback: (e: KeyboardEvent) => void,
  options: KeyboardShortcutOptions = {}
) {
  const {
    metaKey = false,
    ctrlKey = false,
    altKey = false,
    shiftKey = false,
    preventDefault = true,
  } = options;

  const keys = Array.isArray(key) ? key : [key];

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (
        keys.includes(event.key.toLowerCase()) &&
        event.metaKey === metaKey &&
        event.ctrlKey === ctrlKey &&
        event.altKey === altKey &&
        event.shiftKey === shiftKey
      ) {
        if (preventDefault) {
          event.preventDefault();
        }
        callback(event);
      }
    },
    [keys, callback, metaKey, ctrlKey, altKey, shiftKey, preventDefault]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
}
