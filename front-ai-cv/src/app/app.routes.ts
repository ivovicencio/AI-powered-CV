import { Routes } from '@angular/router';
import { Adapter } from './components/adapter/adapter';

export const routes: Routes = [
  { path: '', component: Adapter },
  { path: '**', redirectTo: '' }
];