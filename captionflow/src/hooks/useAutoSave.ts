import { useState, useEffect, useRef, useCallback } from 'react';
import { StorageManager, ProjectData } from '../lib/storage';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export function useAutoSave() {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [projectId, setProjectId] = useState<string | undefined>(undefined);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const triggerSave = useCallback((projectData: Omit<ProjectData, 'id' | 'timestamp'>) => {
    // If we're already saving, don't trigger another save
    if (saveStatus === 'saving') return;

    setSaveStatus('saving');

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(async () => {
      try {
        const currentData = { ...projectData, id: projectId };
        const savedId = await StorageManager.saveProject(currentData);
        
        setProjectId(savedId); 
        setSaveStatus('saved');
      } catch (e) {
        console.error("Autosave failed:", e);
        setSaveStatus('error');
      }
    }, 1500); 
  }, [projectId, saveStatus]);

  useEffect(() => {
    if (saveStatus === 'saved') {
      const timer = setTimeout(() => {
        setSaveStatus('idle');
      }, 2000); 
      return () => clearTimeout(timer);
    }
  }, [saveStatus]);

  return { saveStatus, triggerSave, projectId, setProjectId };
}