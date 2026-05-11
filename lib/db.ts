import Dexie, { type Table } from 'dexie';

export interface Course {
  id: string;
  title: string;
  course_code: string;
  description: string;
  last_fetched: number;
}

export interface Lesson {
  id: string;
  module_id: string;
  title: string;
  content: string;
  video_url?: string;
  order_index: number;
  last_fetched: number;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  course_id: string;
  user_id: string;
  updated_at: string;
  last_fetched: number;
}

export interface Quiz {
  id: string;
  title: string;
  course_id: string;
  questions: any[];
  last_fetched: number;
}

export interface UserProgress {
  id: string;
  user_id: string;
  lesson_id: string;
  completed: boolean;
  last_updated: string;
  is_synced: boolean;
}

export interface SyncQueue {
  id?: number;
  table: string;
  action: 'UPSERT' | 'DELETE';
  data: any;
  timestamp: number;
}

export interface Metadata {
  key: string;
  value: any;
}

export class VisionLearnDB extends Dexie {
  courses!: Table<Course>;
  lessons!: Table<Lesson>;
  notes!: Table<Note>;
  quizzes!: Table<Quiz>;
  progress!: Table<UserProgress>;
  sync_queue!: Table<SyncQueue>;
  metadata!: Table<Metadata>;

  constructor() {
    super('VisionLearnDB');
    this.version(1).stores({
      courses: 'id, course_code',
      lessons: 'id, module_id, order_index',
      notes: 'id, course_id, user_id',
      quizzes: 'id, course_id',
      progress: 'id, user_id, lesson_id, is_synced',
      sync_queue: '++id, table, timestamp',
      metadata: 'key'
    });
  }
}

export const db = new VisionLearnDB();
