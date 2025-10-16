import React from 'react';
import Icon from './Icon';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-slate-900 rounded-lg p-6 max-w-md w-full mx-4 border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Keyboard Shortcuts</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-800 rounded transition-colors"
          >
            <Icon name="X" size={20} />
          </button>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-400">Play/Pause</span>
            <kbd className="px-2 py-1 bg-slate-800 rounded">Space</kbd>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Previous Frame</span>
            <kbd className="px-2 py-1 bg-slate-800 rounded">Q</kbd>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Next Frame</span>
            <kbd className="px-2 py-1 bg-slate-800 rounded">E</kbd>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Skip Backward</span>
            <kbd className="px-2 py-1 bg-slate-800 rounded">J</kbd>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Skip Forward</span>
            <kbd className="px-2 py-1 bg-slate-800 rounded">L</kbd>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Add Caption</span>
            <kbd className="px-2 py-1 bg-slate-800 rounded">N</kbd>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Delete Caption</span>
            <kbd className="px-2 py-1 bg-slate-800 rounded">Del</kbd>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KeyboardShortcutsModal;