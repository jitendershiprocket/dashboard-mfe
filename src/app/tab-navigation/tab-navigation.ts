import { Component, EventEmitter, Input, Output, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface Tab {
  id: string;
  label: string;
  active: boolean;
}

@Component({
  selector: 'app-tab-navigation',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tab-navigation.html',
  styleUrl: './tab-navigation.css'
})
export class TabNavigationComponent implements OnChanges {
  @Input() selectedTab: string = 'overview';
  @Output() tabChange = new EventEmitter<string>();

  tabs: Tab[] = [
    { id: 'overview', label: 'Overview', active: true },
    { id: 'orders', label: 'Orders', active: false },
    { id: 'shipments', label: 'Shipments', active: false },
    { id: 'ndr', label: 'NDR', active: false },
    { id: 'whatsapp', label: 'WhatsApp Comm', active: false },
    { id: 'rto', label: 'RTO', active: false },
    { id: 'courier', label: 'Courier', active: false },
    { id: 'delays', label: 'Delays', active: false }
  ];

  ngOnChanges() {
    this.updateActiveTab();
  }

  updateActiveTab() {
    this.tabs.forEach(tab => tab.active = tab.id === this.selectedTab);
  }

  onTabClick(tabId: string) {
    this.selectedTab = tabId;
    this.updateActiveTab();
    this.tabChange.emit(tabId);
  }
}
