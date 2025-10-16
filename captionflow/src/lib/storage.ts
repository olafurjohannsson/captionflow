import { openDB, DBSchema } from 'idb';

const DB_NAME = 'CaptionEditorDB';
const DB_VERSION = 1;
const PROJECTS_STORE = 'projects';

// Define a schema for type safety
interface CaptionEditorDB extends DBSchema {
  [PROJECTS_STORE]: {
    key: string;
    value: ProjectData;
  };
}

export interface ProjectData {
    id: string;
    captions: string; // Storing captions as a JSON string
    videoName: string;
    videoDuration: number;
    timestamp: number;
    waveformData: number[];
}

export const StorageManager = {
  async init() {
    return await openDB<CaptionEditorDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(PROJECTS_STORE)) {
          db.createObjectStore(PROJECTS_STORE, { keyPath: 'id' });
        }
      }
    });
  },

  async saveProject(data: Omit<ProjectData, 'id' | 'timestamp'> & { id?: string }) {
    const db = await this.init();
    const project: ProjectData = {
      id: data.id || `project_${Date.now()}`,
      captions: data.captions,
      videoName: data.videoName,
      videoDuration: data.videoDuration,
      timestamp: Date.now(),
      waveformData: data.waveformData
    };
    await db.put(PROJECTS_STORE, project);
    return project.id; // Return the ID so we can keep track of it
  },

  async loadLastProject(): Promise<ProjectData | undefined> {
    const db = await this.init();
    const projects = await db.getAll(PROJECTS_STORE);
    if (projects.length === 0) return undefined;
    // Find the project with the most recent timestamp
    return projects.sort((a, b) => b.timestamp - a.timestamp)[0];
  }
};