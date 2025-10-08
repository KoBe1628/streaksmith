import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { db, isBrowser } from '../../core/db/dexie-db';
import { addDays, subDays, format } from 'date-fns';
import { Habit, HabitFrequency } from '../../core/models/habit.models';

@Component({
  standalone: true,
  selector: 'app-settings',
  imports: [CommonModule, MatButtonModule],
  template: `
    <h2>Settings</h2>
    <div class="row" style="margin-top:12px; gap:12px; align-items:center; flex-wrap:wrap;">
      <button mat-stroked-button color="primary" (click)="seedDemo()">Seed demo data</button>
      <button mat-stroked-button (click)="export()">Export JSON</button>
      <input type="file" accept="application/json" (change)="import($event)" />
      <span style="flex:1 0 0"></span>
      <button mat-stroked-button color="warn" (click)="clearAll()">Clear all data</button>
    </div>
  `,
  styles: [
    `
      .row {
        display: flex;
        gap: 12px;
        align-items: center;
      }
    `,
  ],
})
export class SettingsPage {
  async export() {
    if (!isBrowser || !db) {
      alert('Export only works in the browser context.');
      return;
    }
    const d = db;
    const data = { habits: await d.habits.toArray(), entries: await d.entries.toArray() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'streaksmith-export.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  async import(e: Event) {
    if (!isBrowser || !db) {
      alert('Import only works in the browser context.');
      return;
    }
    const d = db; // non-null local for TS

    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      await d.transaction('rw', d.habits, d.entries, async () => {
        if (Array.isArray(data.habits)) await d.habits.bulkPut(data.habits);
        if (Array.isArray(data.entries)) await d.entries.bulkPut(data.entries);
      });
      alert('Import completed.');
    } catch (err) {
      console.error(err);
      alert('Invalid JSON file.');
    }
  }

  async seedDemo() {
    if (!isBrowser || !db) {
      alert('Works only in the browser.');
      return;
    }
    const d = db;

    // local target type to satisfy your union literals
    type SeedTarget = { type: 'count' | 'minutes'; value: number };

    const uid = () => crypto?.randomUUID?.() ?? 'id-' + Math.random().toString(36).slice(2);

    const makeHabit = (
      title: string,
      freq: HabitFrequency,
      target: SeedTarget,
      archived = false
    ): Habit => ({
      id: uid(),
      title,
      frequency: freq,
      target,
      archived,
      createdAt: new Date().toISOString(),
    });

    const habits: Habit[] = [
      makeHabit('Push Ups (AM)', 'daily', { type: 'count', value: 25 }),
      makeHabit('German Words', 'daily', { type: 'minutes', value: 15 }),
      makeHabit('Meditation', 'daily', { type: 'minutes', value: 10 }),
      makeHabit('Pull Ups', 'daily', { type: 'count', value: 10 }, true),
    ];

    await d.habits.bulkAdd(habits).catch(() => {
      /* ignore dupes */
    });

    const start = subDays(new Date(), 29);
    const entries: any[] = [];

    for (let i = 0; i < 30; i++) {
      const day = addDays(start, i);
      const dateKey = format(day, 'yyyy-MM-dd');

      for (const h of habits) {
        const chance = h.archived ? 0.3 : 0.65;
        const completed = Math.random() < chance;

        const val =
          completed && (h as any).target
            ? Math.max(1, Math.round((h as any).target.value * (0.7 + Math.random() * 0.6)))
            : undefined;

        entries.push({
          id: uid(),
          habitId: h.id,
          date: dateKey,
          completed,
          value: val,
          createdAt: new Date().toISOString(),
        });
      }
    }

    await d.entries.bulkAdd(entries).catch(() => {
      /* ignore dupes */
    });

    alert('Demo data added. Open Today/Analytics and refresh to see it!');
  }

  async clearAll() {
    if (!isBrowser || !db) {
      alert('Works only in the browser.');
      return;
    }

    const yes = confirm(
      'This will permanently delete all local data (habits & entries) stored in your browser. ' +
        'If you want a backup, click Cancel and use Export first. Continue?'
    );
    if (!yes) return;

    const d = db; // non-null local for TS
    try {
      // Fast: clear both tables
      await Promise.all([d.entries.clear(), d.habits.clear()]);
      alert('All local data cleared. The app will reload.');
    } catch (e) {
      console.error(e);
      alert('Failed to clear data (see console).');
      return;
    }

    // Reload so computed state resets
    location.reload();
  }
}
