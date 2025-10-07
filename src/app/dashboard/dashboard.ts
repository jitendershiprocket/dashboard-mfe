import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
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
import { HttpService } from '../services/http-service.service';

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
  styleUrl: './dashboard.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent {
  // Backed by a signal to enable granular reactivity without breaking existing bindings
  private selectedTabSignal = signal<'overview' | 'orders' | 'shipments' | 'ndr' | 'whatsapp' | 'rto' | 'courier' | 'delays'>('overview');
  
  // Refresh state
  isRefreshing = false;

  constructor(private http: HttpService) {}

  // Keep the existing binding API intact for templates and child components
  get selectedTab(): string {
    return this.selectedTabSignal();
  }

  onTabChange(tabId: string) {
    this.selectedTabSignal.set(tabId as any);
  }

  /**
   * Refresh all dashboard data by clearing the cache
   * This will force fresh API calls on the next data load
   */
  refreshAllData() {
    this.isRefreshing = true;
    
    // Clear all cached API responses
    this.http.clearCache();
    
    console.log('[Dashboard] Cache cleared - Next API calls will fetch fresh data');
    
    // Show cache statistics
    const stats = this.http.getCacheStats();
    console.log('[Dashboard] Cache statistics:', stats);
    
    // Reset refreshing state after a short delay
    setTimeout(() => {
      this.isRefreshing = false;
      
      // Reload the page to fetch fresh data
      // Note: This is optional - you could instead emit an event to child components
      // to trigger their data reload methods
      window.location.reload();
    }, 500);
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
