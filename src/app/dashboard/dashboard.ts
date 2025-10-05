import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TabNavigationComponent } from '../tab-navigation/tab-navigation';
import { OverviewComponent } from '../overview/overview';
import { OrdersComponent } from '../orders/orders';
import { ShipmentsComponent } from '../shipments/shipments';
import { NdrComponent } from '../ndr/ndr';
import { WhatsappComponent } from '../whatsapp/whatsapp';
import { RtoComponent } from '../rto/rto';
import { CourierComponent } from '../courier/courier';
import { DelaysComponent } from '../delays/delays';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    TabNavigationComponent,
    OverviewComponent,
    OrdersComponent,
    ShipmentsComponent,
    NdrComponent,
    WhatsappComponent,
    RtoComponent,
    CourierComponent,
    DelaysComponent
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class DashboardComponent {
  selectedTab: string = 'overview';

  onTabChange(tabId: string) {
    this.selectedTab = tabId;
  }

  getCurrentComponent() {
    switch (this.selectedTab) {
      case 'overview':
        return 'app-overview';
      case 'orders':
        return 'app-orders';
      case 'shipments':
        return 'app-shipments';
      case 'ndr':
        return 'app-ndr';
      case 'whatsapp':
        return 'app-whatsapp';
      case 'rto':
        return 'app-rto';
      case 'courier':
        return 'app-courier';
      case 'delays':
        return 'app-delays';
      default:
        return 'app-overview';
    }
  }
}
