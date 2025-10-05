import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-overview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './overview.html',
  styleUrl: './overview.css'
})
export class OverviewComponent {
  // Today's Orders data
  todaysOrders = {
    value: 472,
    yesterday: 597
  };

  // Today's Revenue data
  todaysRevenue = {
    value: '₹6,93,026',
    yesterday: '₹3,78,638'
  };

  // Shipments Details
  shipmentsDetails = [
    { label: 'Total Shipments', value: '35.3K' },
    { label: 'Pickup Pending', value: '1.0K' },
    { label: 'In-Transit', value: '48' },
    { label: 'Delivered', value: '46' },
    { label: 'NDR Pending', value: '28' },
    { label: 'RTO', value: '7' }
  ];

  // NDR Details
  ndrDetails = [
    { label: 'Total NDR', value: '30' },
    { label: 'Your Reattempt Request', value: '16' },
    { label: 'Buyer Reattempt Request', value: '5' },
    { label: 'NDR Delivered', value: '0' }
  ];
}
