import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HabitStore } from '../../core/store/habit.store';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { HabitFormDialog } from './habit-form.dialog';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { FormsModule } from '@angular/forms';

@Component({
  standalone: true,
  selector: 'app-habits',
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatDialogModule,
    HabitFormDialog,
    MatSlideToggleModule,
  ],
  template: `
    <div class="header">
      <h2>Habits</h2>
      <mat-slide-toggle [(ngModel)]="showArchived">Show archived</mat-slide-toggle>
      <button mat-raised-button color="primary" (click)="openCreate()">+ Add Habit</button>
    </div>

    <ng-container *ngIf="visibleHabits().length; else empty">
      <ul class="list">
        <li *ngFor="let h of visibleHabits()">
          <div class="meta">
            <strong>{{ h.title }}</strong>
            <small *ngIf="h.target">• {{ h.target.type }}: {{ h.target.value }}</small>
            <small *ngIf="h.archived"> • archived</small>
          </div>
          <div class="actions">
            <button mat-button (click)="openEdit(h.id)">Edit</button>
            <button mat-button (click)="toggleArchive(h.id, !h.archived)">
              {{ h.archived ? 'Unarchive' : 'Archive' }}
            </button>
          </div>
        </li>
      </ul>
    </ng-container>

    <ng-template #empty>
      <p *ngIf="!showArchived">No active habits. Create one!</p>
      <p *ngIf="showArchived">No archived habits.</p>
    </ng-template>
  `,
  styles: [
    `
      .header {
        display: flex;
        align-items: center;
        gap: 12px;
      }
    `,
    `
      .header h2 {
        flex: 1;
      }
    `,
    `
      .list {
        list-style: none;
        padding: 0;
        margin: 16px 0;
      }
    `,
    `
      .list li {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 0;
        border-bottom: 1px solid #eee;
      }
    `,
    `
      .meta small {
        opacity: 0.7;
        margin-left: 8px;
      }
    `,
  ],
})
export class HabitsPage implements OnInit {
  constructor(public store: HabitStore, private dialog: MatDialog) {}
  ngOnInit() {
    this.store.loadAll();
  }

  openCreate() {
    this.dialog.open(HabitFormDialog, { width: '460px' });
  }
  toggleArchive(id: string, archived: boolean) {
    this.store.archiveHabit(id, archived);
  }

  openEdit(id: string) {
    this.dialog.open(HabitFormDialog, { width: '460px', data: { id } });
  }

  showArchived = false;

  visibleHabits() {
    const list = this.store.habits();
    return this.showArchived ? list : list.filter((h) => !h.archived);
  }
}
