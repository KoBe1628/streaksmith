export type HabitFrequency = 'daily' | 'custom';

export interface Habit {
  id: string;
  title: string;
  frequency: HabitFrequency;
  customDays?: number[]; // 0=Sun..6=Sat
  target?: { type: 'count' | 'minutes'; value: number };
  archived?: boolean;
  createdAt: string; // ISO
}

export interface Entry {
  id: string;
  habitId: string;
  date: string; // YYYY-MM-DD
  value?: number;
  completed: boolean;
  createdAt: string; // ISO
}
