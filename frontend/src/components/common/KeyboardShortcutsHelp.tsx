import React, { useState, useEffect } from 'react';
import { useKeyboardShortcut } from '@/utils/useKeyboardShortcut';

type KeyboardShortcutsHelpProps = {
  shortcuts: {
    key: string;
    description: string;
    category?: string;
  }[];
};

const KeyboardShortcutsHelp: React.FC<KeyboardShortcutsHelpProps> = ({ shortcuts }) => {
  const [isOpen, setIsOpen] = useState(false);

  // Group shortcuts by category
  const shortcutsByCategory = shortcuts.reduce((acc, shortcut) => {
    const category = shortcut.category || 'General';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(shortcut);
    return acc;
  }, {} as Record<string, typeof shortcuts>);

  // Toggle dialog with '?' key
  useKeyboardShortcut('?', () => {
    setIsOpen(!isOpen);
  });

  // Close dialog with Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  if (!isOpen) {
    return (
      <button
        className="fixed bottom-4 right-4 bg-gray-800 text-white w-8 h-8 rounded-full flex items-center justify-center opacity-70 hover:opacity-100 transition-opacity z-50"
        onClick={() => setIsOpen(true)}
        aria-label="Keyboard shortcuts"
        title="Press ? for keyboard shortcuts"
      >
        ?
      </button>
    );
  }

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-50"
        onClick={() => setIsOpen(false)}
      />
      
      {/* Dialog */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
          <div className="border-b px-6 py-4 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Keyboard Shortcuts</h2>
            <button
              className="text-gray-500 hover:text-gray-700"
              onClick={() => setIsOpen(false)}
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="p-6 overflow-y-auto flex-1">
            {Object.entries(shortcutsByCategory).map(([category, categoryShortcuts]) => (
              <div key={category} className="mb-6 last:mb-0">
                <h3 className="text-sm font-medium text-gray-700 mb-3">{category}</h3>
                <div className="bg-gray-50 rounded-md">
                  {categoryShortcuts.map((shortcut, i) => (
                    <div 
                      key={i} 
                      className={`flex items-center justify-between py-2 px-4 ${
                        i < categoryShortcuts.length - 1 ? 'border-b border-gray-100' : ''
                      }`}
                    >
                      <span className="text-gray-700">{shortcut.description}</span>
                      <kbd className="bg-gray-200 px-2 py-1 text-xs font-semibold text-gray-800 rounded-md">
                        {shortcut.key}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          
          <div className="border-t px-6 py-4 bg-gray-50">
            <p className="text-xs text-gray-500">
              Press <kbd className="bg-gray-200 px-2 py-1 text-xs font-semibold text-gray-800 rounded-md">Esc</kbd> to close
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default KeyboardShortcutsHelp;
