/**
 * @file app.routes.ts
 * @description Configuration des routes globales avec Lazy Loading.
 */

import { Routes } from '@angular/router';
import { MainLayoutComponent } from './core/layout/main';

export const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      {
        path: '',
        redirectTo: 'calendar',
        pathMatch: 'full'
      },
      {
        path: 'calendar',
        loadComponent: () =>
          import('./features/calendar-timeline/calendar').then(
            (m) => m.CalendarTimelineComponent
          )
      },
      {
        path: 'properties',
        loadComponent: () =>
          import('./features/properties/components/properties-list/list').then(
            (m) => m.PropertiesListComponent
          )
      },
      {
        path: 'properties/:id',
        loadComponent: () =>
          import('./features/properties/components/property-detail/detail').then(
            (m) => m.PropertyDetailComponent
          )
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'calendar'
  }
];