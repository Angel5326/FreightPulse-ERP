import { Routes } from '@angular/router';
import { Login } from './components/login/login';
import { DashboardComponent } from './components/dashboard/dashboard';
import { ShipmentEntryFormComponent } from './shipment-entry-form/shipment-entry-form';
import { ShipmentListComponent } from './components/shipment-list/shipment-list';   // ✅ No .component

export const routes: Routes = [
  { path: 'login', component: Login },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'form', component: ShipmentEntryFormComponent },
  { path: 'shipments', component: ShipmentListComponent },   // 👈 ADD THIS
  { path: '', redirectTo: '/login', pathMatch: 'full' },
];
