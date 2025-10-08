import { Component, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HabitStore } from '../../core/store/habit.store';
import { MatListModule } from '@angular/material/list';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  standalone: true,
  selector: 'app-today',
  imports: [
    CommonModule,
    FormsModule,
    MatListModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  template: `
    <h2>Today</h2>

    <ng-container *ngIf="!store.loading(); else loading">
      <mat-nav-list *ngIf="dueHabits().length; else empty">
        <a mat-list-item *ngFor="let h of dueHabits()">
          <div style="display:flex;align-items:center;gap:12px;width:100%">
            <mat-checkbox
              [checked]="completedMap()[h.id]"
              (change)="
                store.toggleToday(h.id, h.target ? values[h.id] ?? h.target.value : undefined)
              "
            >
              {{ h.title }}
            </mat-checkbox>

            <span *ngIf="h.target" style="opacity:.7;font-size:.9rem; margin-left:8px">
              {{ (valueMap()[h.id] ?? values[h.id]) || 0 }} / {{ h.target.value }}
            </span>

            <!-- show input only if habit has a numeric target -->
            <ng-container *ngIf="h.target">
              <mat-form-field
                appearance="outline"
                [class.dim]="completedMap()[h.id]"
                style="width:120px;margin-left:auto;"
              >
                <mat-label>{{ h.target.type }}</mat-label>
                <input
                  matInput
                  type="number"
                  min="0"
                  [placeholder]="h.target.value.toString()"
                  [(ngModel)]="values[h.id]"
                  [disabled]="completedMap()[h.id]"
                />
              </mat-form-field>
            </ng-container>
          </div>
        </a>
      </mat-nav-list>
    </ng-container>

    <ng-template #loading>
      <div class="center"><mat-spinner></mat-spinner></div>
    </ng-template>

    <ng-template #empty>
      <p>No habits due today. Add some in Habits.</p>
    </ng-template>
  `,
  styles: [
    `
      .center {
        display: flex;
        justify-content: center;
        padding: 24px;
      }
    `,
  ],
})
export class TodayPage implements OnInit {
  values: Record<string, number> = {};
  constructor(public store: HabitStore) {}
  ngOnInit() {
    this.store.loadAll().then(() => {
      // prefill from existing entries for today
      for (const e of this.store.todayEntries()) {
        if (e.value != null) this.values[e.habitId] = e.value;
      }
    });
  }

  // MVP rule: all non-archived habits are due daily
  dueHabits = computed(() => this.store.habits().filter((h) => !h.archived));

  completedMap = computed(() => {
    const map: Record<string, boolean> = {};
    for (const e of this.store.todayEntries()) map[e.habitId] = e.completed;
    return map;
  });

  //show the logged value right on Today (e.g., 10 / 25) and prefill the input if you already logged earlier today.
  valueMap = computed(() => {
    const map: Record<string, number> = {};
    for (const e of this.store.todayEntries()) {
      if (e.value != null) map[e.habitId] = e.value;
    }
    return map;
  });
}
