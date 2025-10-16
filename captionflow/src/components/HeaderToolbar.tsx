import { type FC } from 'react';
import { Film, Download, Keyboard, Github } from 'lucide-react';
import { SaveStatus } from '../hooks/useAutoSave'; // Adjust path if needed

interface HeaderToolbarProps {
  onExport: (format: string) => void;
  onShowKeyboardShortcuts: () => void;
  saveStatus: SaveStatus;
  hasVideo: boolean;
  hasCaptions: boolean;
}

const SaveStatusIndicator: FC<{ status: SaveStatus }> = ({ status }) => {
  if (status === 'idle') return <div className="w-20"></div>; // Reserve space

  const config = {
    saving: { text: 'Saving...' },
    saved: { text: 'Saved' },
    error: { text: 'Error!' },
  };

  return (
    <div className="flex items-center justify-center w-20 text-sm text-foreground-muted">
      {config[status]?.text}
    </div>
  );
};

const HeaderToolbar: FC<HeaderToolbarProps> = ({
  onExport,
  onShowKeyboardShortcuts,
  saveStatus,
  hasVideo,
  hasCaptions,
}) => {
  const canExport = hasVideo && hasCaptions;

  return (
    <header className="h-14 bg-card border-b border-border flex items-center justify-between px-4 z-50">
      <div className="flex items-center space-x-3">
        <a href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Film className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold text-foreground">CaptionFlow</span>
        </a>
      </div>

      <div className="absolute left-1/2 -translate-x-1/2">
        <SaveStatusIndicator status={saveStatus} />
      </div>

      <div className="flex items-center space-x-4">
        <button
          onClick={() => onExport('srt')}
          disabled={!canExport}
          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-secondary text-secondary-foreground rounded-md hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Download className="w-4 h-4" />
          Export .srt
        </button>
        <button
          onClick={onShowKeyboardShortcuts}
          className="p-2 text-foreground-muted hover:text-foreground transition-colors"
          title="Keyboard Shortcuts"
        >
          <Keyboard className="w-5 h-5" />
        </button>
        <a 
          href="https://github.com/olafurjohannsson/caption-editor" 
          target="_blank" 
          rel="noopener noreferrer"
          className="p-2 text-foreground-muted hover:text-foreground transition-colors"
          title="View on GitHub"
        >
          <Github className="w-5 h-5" />
        </a>
      </div>
    </header>
  );
};

export default HeaderToolbar;