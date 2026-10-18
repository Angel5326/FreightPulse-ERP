import { Routes } from '@angular/router';
import { Login } from './components/login/login';
import { DashboardComponent } from './components/dashboard/dashboard';
import { ShipmentListComponent } from './components/shipment-list/shipment-list';
import { ShipmentEntryFormComponent } from './shipment-entry-form/shipment-entry-form';
import { ActivityLogComponent } from './components/activity-log/activity-log';
import { AnalyticsComponent } from './components/analytics/analytics';
import { ClientsComponent } from './components/clients/clients';
import { InvoicesComponent } from './components/invoices/invoices';
import { PaymentsComponent } from './components/payments/payments';
import { ShipmentDetailComponent } from './components/shipment-detail/shipment-detail';
import { AdminPanelComponent } from './components/admin-panel/admin-panel';

export const routes: Routes = [
  { path: 'login', component: Login },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'shipments', component: ShipmentListComponent },
  { path: 'shipment/:id', component: ShipmentDetailComponent },
  { path: 'form', component: ShipmentEntryFormComponent },
  { path: 'clients', component: ClientsComponent },
  { path: 'invoices', component: InvoicesComponent },
  { path: 'payments', component: PaymentsComponent },
  { path: 'analytics', component: AnalyticsComponent },
  { path: 'activity-log', component: ActivityLogComponent },
  { path: 'admin-panel', component: AdminPanelComponent },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
];