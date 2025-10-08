import Dexie, { Table } from 'dexie';
import { Habit, Entry } from '../models/habit.models';

// SSR guard: IndexedDB only exists in the browser
export const isBrowser =
  typeof window !== 'undefined' && typeof (window as any).indexedDB !== 'undefined';

export class StreaksmithDB extends Dexie {
  habits!: Table<Habit, string>;
  entries!: Table<Entry, string>;

  constructor() {
    super('streaksmith-db');
    this.version(1).stores({
      habits: 'id, title, archived, createdAt',
      entries: 'id, habitId, date, completed, createdAt',
    });
  }
}

// Create DB only on the client. On the server it will be null.
export const db: StreaksmithDB | null = isBrowser ? new StreaksmithDB() : null;
