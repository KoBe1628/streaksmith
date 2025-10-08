import { Component, Inject } from '@angular/core';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
// import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
// import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { HabitStore } from '../../core/store/habit.store';

@Component({
  standalone: true,
  selector: 'app-habit-form-dialog',
  imports: [
    CommonModule,
    MatDialogModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
  ],
  template: `
    <h2 mat-dialog-title>New Habit</h2>

    <form [formGroup]="form" (ngSubmit)="submit()" class="form">
      <mat-form-field appearance="outline">
        <mat-label>Title</mat-label>
        <input matInput formControlName="title" placeholder="e.g., German vocab 15 min" />
        <mat-error *ngIf="form.get('title')?.invalid">Title required</mat-error>
      </mat-form-field>

      <div class="row">
        <mat-form-field appearance="outline">
          <mat-label>Target Type</mat-label>
          <mat-select formControlName="type">
            <mat-option value="count">Count</mat-option>
            <mat-option value="minutes">Minutes</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Target Value</mat-label>
          <input type="number" matInput formControlName="value" placeholder="e.g., 20" />
        </mat-form-field>
      </div>

      <div class="actions">
        <button mat-stroked-button type="button" (click)="close()">Cancel</button>
        <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid">
          Create
        </button>
      </div>
    </form>
  `,
  styles: [
    `
      .form {
        display: grid;
        gap: 12px;
        padding: 8px 0;
      }
    `,
    `
      .row {
        display: grid;
        gap: 12px;
        grid-template-columns: 1fr 1fr;
      }
    `,
    `
      @media (max-width: 640px) {
        .row {
          grid-template-columns: 1fr;
        }
      }
    `,
    `
      .actions {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
        margin-top: 8px;
      }
    `,
  ],
})
export class HabitFormDialog {
  form!: FormGroup;
  isEdit = false;
  private editingId?: string;

  constructor(
    private fb: FormBuilder,
    private ref: MatDialogRef<HabitFormDialog>,
    private store: HabitStore,
    @Inject(MAT_DIALOG_DATA) public data: { id?: string } | null
  ) {
    this.form = this.fb.group({
      title: ['', Validators.required],
      type: ['count', Validators.required],
      value: [10, [Validators.required, Validators.min(1)]],
    });

    // if opened for edit, prefill
    if (data?.id) {
      this.isEdit = true;
      this.editingId = data.id;

      const h = this.store.habits().find((x) => x.id === data.id);
      if (h) {
        this.form.patchValue({
          title: h.title,
          type: h.target?.type ?? 'count',
          value: h.target?.value ?? 10,
        });
      }
    }
  }

  async submit() {
    if (this.form.invalid) return;
    const f = this.form.value;

    if (this.isEdit && this.editingId) {
      await this.store.updateHabit(this.editingId, {
        title: f.title!,
        target: { type: f.type as 'count' | 'minutes', value: Number(f.value) },
      });
    } else {
      await this.store.addHabit({
        title: f.title!,
        frequency: 'daily',
        target: { type: f.type as 'count' | 'minutes', value: Number(f.value) },
        archived: false,
        createdAt: new Date().toISOString(),
        id: '' as any,
      } as any);
    }

    this.ref.close();
  }

  close() {
    this.ref.close();
  }
}
