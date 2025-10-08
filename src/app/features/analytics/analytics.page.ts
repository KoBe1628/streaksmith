import { Component, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { addDays, format, subDays } from 'date-fns';
import { HabitStore } from '../../core/store/habit.store';

type DayCell = { date: string; count: number }; // date = 'yyyy-MM-dd'

@Component({
  standalone: true,
  selector: 'app-analytics',
  imports: [CommonModule],
  template: `
    <h2>Analytics</h2>

    <!-- KPIs -->
    <div class="kpis">
      <div class="kpi">
        <div class="label">Current streak</div>
        <div class="value">🔥 {{ currentStreak() }} day{{ currentStreak() === 1 ? '' : 's' }}</div>
      </div>
      <div class="kpi">
        <div class="label">Best streak</div>
        <div class="value">{{ bestStreak() }} day{{ bestStreak() === 1 ? '' : 's' }}</div>
      </div>
      <div class="kpi">
        <div class="label">7-day completion</div>
        <div class="value">{{ sevenDayPct() }}%</div>
      </div>
    </div>

    <!-- Heatmap (last 30 days) -->
    <h3>Last 30 days</h3>
    <div class="heatmap" *ngIf="cellsByWeek().length; else empty">
      <div class="week" *ngFor="let week of cellsByWeek()">
        <div
          class="cell"
          *ngFor="let d of week"
          [title]="tooltip(d)"
          [class.lv0]="d.count === 0"
          [class.lv1]="d.count === 1"
          [class.lv2]="d.count === 2"
          [class.lv3]="d.count >= 3"
          aria-label="{{ tooltip(d) }}"
        ></div>
      </div>
    </div>

    <ng-template #empty>
      <p>No data yet. Check off some habits on the Today page.</p>
    </ng-template>
  `,
  styles: [
    `
      .kpis {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 12px;
        margin: 12px 0 20px;
      }
      .kpi {
        padding: 12px;
        border: 1px solid #eee;
        border-radius: 12px;
        background: #fff;
      }
      .label {
        opacity: 0.7;
        font-size: 0.9rem;
      }
      .value {
        font-size: 1.25rem;
        font-weight: 600;
      }

      .heatmap {
        display: flex;
        gap: 6px;
        align-items: flex-start;
      }
      .week {
        display: grid;
        grid-template-rows: repeat(7, 1fr);
        gap: 4px;
      }
      .cell {
        width: 14px;
        height: 14px;
        border-radius: 3px;
        background: #eee;
      }
      .cell.lv0 {
        background: #eee;
      }
      .cell.lv1 {
        background: #cde7d8;
      }
      .cell.lv2 {
        background: #7cc69e;
      }
      .cell.lv3 {
        background: #2d8a5b;
      }
      @media (max-width: 640px) {
        .kpis {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class AnalyticsPage implements OnInit {
  constructor(public store: HabitStore) {}

  ngOnInit() {
    this.store.loadAll();
  }

  // ---- helpers / computed ----

  private entriesByDate = computed(() => {
    const map = new Map<string, number>(); // date -> completed count
    for (const e of this.store.entries()) {
      if (!e.completed) continue;
      map.set(e.date, (map.get(e.date) ?? 0) + 1);
    }
    return map;
  });

  // last 30 days cells (Sun..Sat columns)
  private last30 = computed<DayCell[]>(() => {
    const today = new Date();
    const start = subDays(today, 29);
    const out: DayCell[] = [];
    const byDate = this.entriesByDate();
    for (let i = 0; i < 30; i++) {
      const d = addDays(start, i);
      const key = format(d, 'yyyy-MM-dd');
      out.push({ date: key, count: byDate.get(key) ?? 0 });
    }
    return out;
  });

  cellsByWeek = computed(() => {
    // build weeks of 7 cells aligned Sun..Sat
    // We’ll just split the 30 sequence into columns by weekday for a compact display.
    const days = this.last30();
    // group into weeks: 5 columns (the first may have <7 if not aligned)
    const weeks: DayCell[][] = [];
    let current: DayCell[] = [];
    for (const cell of days) {
      current.push(cell);
      if (current.length === 7) {
        weeks.push(current);
        current = [];
      }
    }
    if (current.length) weeks.push(current);
    // transpose to columns by weekday so it looks like many heatmaps (optional)
    // But simpler: keep as sequential weeks top->bottom.
    return weeks.map((week) => {
      // pad to 7 for nice grid
      const missing = 7 - week.length;
      return missing
        ? [...week, ...Array.from({ length: missing }, () => ({ date: '', count: 0 }))]
        : week;
    });
  });

  // KPIs
  currentStreak = computed(() => {
    // consecutive days up to today with >=1 completion
    const map = this.entriesByDate();
    let streak = 0;
    let d = new Date();
    while (true) {
      const key = format(d, 'yyyy-MM-dd');
      if ((map.get(key) ?? 0) > 0) {
        streak++;
        d = subDays(d, 1);
      } else break;
    }
    return streak;
  });

  bestStreak = computed(() => {
    const map = this.entriesByDate();
    if (map.size === 0) return 0;
    // build a sorted list of unique dates
    const keys = Array.from(map.keys()).sort();
    let best = 0,
      cur = 0,
      prev: string | null = null;
    for (const k of keys) {
      if (!prev) {
        cur = map.get(k)! > 0 ? 1 : 0;
        prev = k;
        best = Math.max(best, cur);
        continue;
      }
      // check if k is prev+1 day
      const prevDate = new Date(prev + 'T00:00:00');
      const nextOfPrev = addDays(prevDate, 1);
      const nextKey = format(nextOfPrev, 'yyyy-MM-dd');
      if (k === nextKey && map.get(k)! > 0) {
        cur += 1;
      } else {
        cur = map.get(k)! > 0 ? 1 : 0;
      }
      best = Math.max(best, cur);
      prev = k;
    }
    return best;
  });

  sevenDayPct = computed(() => {
    const byDate = this.entriesByDate();
    let ok = 0;
    for (let i = 0; i < 7; i++) {
      const key = format(subDays(new Date(), i), 'yyyy-MM-dd');
      if ((byDate.get(key) ?? 0) > 0) ok++;
    }
    return Math.round((ok / 7) * 100);
  });

  tooltip(d: DayCell) {
    if (!d.date) return '';
    // e.g., "2025-10-08 — 1 habit" / "3 habits"
    const label = d.count === 1 ? '1 habit' : `${d.count} habits`;
    return `${d.date} — ${label}`;
  }
}
