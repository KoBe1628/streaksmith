import { Injectable, computed, signal } from '@angular/core';
import { format } from 'date-fns';
import { db, isBrowser } from '../db/dexie-db';
import { Habit, Entry } from '../models/habit.models';

const todayKey = () => format(new Date(), 'yyyy-MM-dd');

@Injectable({ providedIn: 'root' })
export class HabitStore {
  // state
  habits = signal<Habit[]>([]);
  entries = signal<Entry[]>([]);
  loading = signal<boolean>(false);

  // derived state
  todayEntries = computed(() => this.entries().filter((e) => e.date === todayKey()));

  // effects
  async loadAll() {
    if (!isBrowser || !db) return; // <-- guard
    this.loading.set(true);
    const [h, e] = await Promise.all([db.habits.toArray(), db.entries.toArray()]);
    this.habits.set(h);
    this.entries.set(e);
    this.loading.set(false);
  }

  async addHabit(data: Omit<Habit, 'id' | 'createdAt'>) {
    if (!isBrowser || !db) return; // <-- guard
    const habit: Habit = { ...data, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    await db.habits.add(habit);
    this.habits.set([habit, ...this.habits()]);
  }

  async archiveHabit(habitId: string, archived = true) {
    if (!isBrowser || !db) return; // <-- guard
    const current = this.habits().find((h) => h.id === habitId);
    if (!current) return;
    const updated = { ...current, archived } as Habit;
    await db.habits.put(updated);
    this.habits.set(this.habits().map((h) => (h.id === habitId ? updated : h)));
  }

  async toggleToday(habitId: string, value?: number) {
    if (!isBrowser || !db) return; // <-- guard
    const key = todayKey();
    const existing = this.entries().find((e) => e.habitId === habitId && e.date === key);

    if (existing) {
      const updated: Entry = { ...existing, completed: !existing.completed, value };
      await db.entries.put(updated);
      this.entries.set(this.entries().map((e) => (e.id === updated.id ? updated : e)));
      return;
    }

    const entry: Entry = {
      id: crypto.randomUUID(),
      habitId,
      date: key,
      value,
      completed: true,
      createdAt: new Date().toISOString(),
    };
    await db.entries.add(entry);
    this.entries.set([entry, ...this.entries()]);
  }

  async updateHabit(habitId: string, patch: Partial<Habit>) {
    if (!isBrowser || !db) return;
    const current = this.habits().find((h) => h.id === habitId);
    if (!current) return;
    const updated: Habit = { ...current, ...patch };
    await db.habits.put(updated);
    this.habits.set(this.habits().map((h) => (h.id === habitId ? updated : h)));
  }
}
