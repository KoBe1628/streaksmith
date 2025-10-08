import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { db, isBrowser } from '../../core/db/dexie-db';

@Component({
  standalone: true,
  selector: 'app-settings',
  imports: [CommonModule, MatButtonModule],
  template: `
    <h2>Settings</h2>
    <div class="row">
      <button mat-stroked-button (click)="export()">Export JSON</button>
      <input type="file" accept="application/json" (change)="import($event)" />
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
}
