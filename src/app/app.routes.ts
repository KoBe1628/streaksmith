import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'today', pathMatch: 'full' },
  {
    path: 'today',
    loadComponent: () => import('./features/today/today.page').then((m) => m.TodayPage),
  },
  {
    path: 'habits',
    loadComponent: () => import('./features/habits/habits.page').then((m) => m.HabitsPage),
  },
  {
    path: 'analytics',
    loadComponent: () => import('./features/analytics/analytics.page').then((m) => m.AnalyticsPage),
  },
  {
    path: 'settings',
    loadComponent: () => import('./features/settings/settings.page').then((m) => m.SettingsPage),
  },
  { path: '**', redirectTo: 'today' },
];
