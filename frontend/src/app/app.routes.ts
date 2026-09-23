import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'properties',
    pathMatch: 'full'
  },
  {
    path: 'properties',
    loadComponent: () => 
      import('./features/properties/components/properties-list/list')
        .then(m => m.PropertiesListComponent)
  },
  {
    path: 'properties/:propertyId',
    loadComponent: () => 
      import('./features/properties/components/properties-list/list')
        .then(m => m.PropertiesListComponent)
  },
  {
    path: 'properties/:propertyId/units/:unitId',
    loadComponent: () => 
      import('./features/properties/components/properties-list/list')
        .then(m => m.PropertiesListComponent)
  },
  {
    path: '**',
    redirectTo: 'properties'
  }
];