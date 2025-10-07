import { Component, ElementRef, OnInit, ViewChild, ChangeDetectionStrategy, ChangeDetectorRef, signal, computed, afterNextRender } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpService } from '../services/http-service.service';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';

@Component({
  selector: 'app-overview',
  standalone: true,
  imports: [CommonModule, FormsModule, BaseChartDirective],
  templateUrl: './overview.html',
  styleUrl: './overview.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OverviewComponent implements OnInit {
  @ViewChild('carouselElement') carouselElement!: ElementRef;
  
  // Data properties (signals with compatibility getters)
  kycNewStrip = false;
  kycByPass: any;
  is_seller: any;
  kyc_status: any;
  private _bannerdata = signal<any>(null);
  private _pinotData = signal<any>(null);
  private _shippingData = signal<any>(null);
  private _ndrData = signal<any>(null);
  private _avgshipCost = signal<any>(null);
  private _statuses = signal<any>(null);
  private _codStatuses = signal<any>(null);
  private _revenues = signal<any>(null);
  private _mapData = signal<any>(null);
  mapFilterData = 'Order';
  private _pinotDistributionData = signal<any>(null);

  // Compatibility getters so templates remain unchanged
  get bannerdata() { return this._bannerdata(); }
  get pinotData() { return this._pinotData(); }
  get shippingData() { return this._shippingData(); }
  get ndrData() { return this._ndrData(); }
  get avgshipCost() { return this._avgshipCost(); }
  get statuses() { return this._statuses(); }
  get codStatuses() { return this._codStatuses(); }
  get revenues() { return this._revenues(); }
  get mapData() { return this._mapData(); }
  get pinotDistributionData() { return this._pinotDistributionData(); }
  
  // Chart.js properties
  public doughnutChartType: 'doughnut' = 'doughnut' as const;
  public pieChartType: 'pie' = 'pie' as const;
  
  // Courier Split Chart
  public courierChartData: ChartData<'doughnut'> = { labels: [], datasets: [] };
  public courierChartOptions: ChartConfiguration<'doughnut'>['options'] = {};
  
  // Shipment Status Chart
  public shipmentChartData: ChartData<'doughnut'> = { labels: [], datasets: [] };
  public shipmentChartOptions: ChartConfiguration<'doughnut'>['options'] = {};
  
  // Delivery Performance Chart
  public deliveryChartData: ChartData<'doughnut'> = { labels: [], datasets: [] };
  public deliveryChartOptions: ChartConfiguration<'doughnut'>['options'] = {};
  
  // Tooltip text
  totalShipmentToolTip = `Count of total shipments assigned in last 30 days excluding shipments in cancellation requested and cancelled status.<br><br>
  Note: The total count here is not the sum of values shown in previous columns`;
  lostDamagedToolTip = `The 'Lost/Damaged' count includes shipments marked as Lost, Damaged, Destroyed, and Disposed-Off`;
  
  // User data
  companyID: any;
  deliveryDonutData: any;
  
  constructor(private http: HttpService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.createMapChart([], '', '');
    const data = localStorage.getItem('ngStorage-USER');
    this.kycNewStrip = data ? JSON.parse(data).is_kyc_new_strip : false;
    this.kycByPass = data ? JSON.parse(data).kyc_shipment_check_rb : '';
    this.kyc_status = data ? JSON.parse(data).kyc_status : '';
    this.is_seller = data ? JSON.parse(data).is_seller : '';
    this.companyID = data ? JSON.parse(data).company_id : '';
    
    // Load data
    this.sellerBanner();
    this.getPinotData();
    this.getDistributionDataPinot();
    this.getRevenueDetailsPinot();
    this.getavgShipCost();
    this.getCodData();
    this.getDeliveryPerformance();
    this.getRevenuesData();
    this.getShippingOverviewCombinedData();
    
    setTimeout(() => {
      this.getStateDataPinot('Order');
    }, 500);
  }

  onBannerClick() {
    // Track banner click event
    console.log('Banner clicked', this.bannerdata[0]);
  }

  openBannerLandingPage(url: any) {
    window.open(url?.landing_page);
  }

  initializeCarouselEvents() {
    if (!this.bannerdata || this.bannerdata.length <= 1) {
      return;
    }

    setTimeout(() => {
      if (this.carouselElement && this.carouselElement.nativeElement) {
        const carousel = this.carouselElement.nativeElement;
        const hasAutoScroll = carousel.getAttribute('data-bs-ride') === 'carousel';
        
        if (!hasAutoScroll) {
          return;
        }

        carousel.addEventListener('slid.bs.carousel', (event: any) => {
          const activeIndex = event.to;
          const bannerItem = this.bannerdata[activeIndex];
          console.log('Banner changed to index:', activeIndex);
        });
      }
    }, 100);
  }

  sellerBanner() {
    this.http.get('shiprocket-pilot').subscribe(
      (res: any) => {
        if (res.top_banner !== null) {
          this._bannerdata.set(res.top_banner);
        }
        this.initializeCarouselEvents();
        this.cdr.markForCheck();
      },
      (err: any) => {
        console.error('Error fetching banner', err);
      }
    );
  }

  getPinotData() {
    this.http.getPinot('dashboard/details').subscribe(
      (res: any) => {
        this._pinotData.set(res.data);
        console.log('Pinot data loaded:', res.data);
        
        // Ensure DOM is ready for charts
        afterNextRender(() => {
          if (res.data?.shipment_details && res.data?.shipment_details.length > 0) {
            console.log('Creating shipment chart...');
            this.createShipmentStatusDonutChart(res.data.shipment_details?.[0]);
          }
          if (res.data?.courier_split && res.data?.courier_split.length > 0) {
            console.log('Creating courier chart...');
            this.createDonutChart(res.data.courier_split);
          }
        });
        this.cdr.markForCheck();
      },
      (err: any) => {
        console.error('Error fetching pinot data', err);
      }
    );
  }

  getRevenueDetailsPinot() {
    this.http.getPinot('dashboard/revenue-data').subscribe(
      (res: any) => {
        // Handle revenue data if needed
        this.cdr.markForCheck();
      },
      (err: any) => {
        console.error('Error fetching revenue data', err);
      }
    );
  }

  getDistributionDataPinot() {
    this.http.getPinot('dashboard/shipment-courier-wise').subscribe(
      (res: any) => {
        this._pinotDistributionData.set(res.data.shipment_overview_by_courier);
        this.cdr.markForCheck();
      },
      (err: any) => {
        console.error('Error fetching distribution data', err);
      }
    );
  }

  getStateDataPinot(type: any) {
    this.http.getPinot('dashboard/statewise-data').subscribe(
      (res: any) => {
        this.mapCalculation(type, res);
        this.cdr.markForCheck();
      },
      (err: any) => {
        console.error('Error fetching state data', err);
      }
    );
  }

  getavgShipCost() {
    this.http.srDashboardGet('getavgshippingcost').subscribe(
      (res: any) => {
        this._avgshipCost.set(res.data[0]);
        this.cdr.markForCheck();
      },
      (err: any) => {
        console.error('Error fetching avg ship cost', err);
      }
    );
  }

  getRevenuesData() {
    this.http.srDashboardGet('getrevenuedata').subscribe(
      (res: any) => {
        this._revenues.set(res.data[0]);
        this.cdr.markForCheck();
      },
      (err: any) => {
        console.error('Error fetching revenue data', err);
      }
    );
  }

  getCodData() {
    this.http.get('account/details/remittance_summary').subscribe(
      (res: any) => {
        this._codStatuses.set(res);
        this.cdr.markForCheck();
      },
      (err: any) => {
        console.error('Error fetching cod statuses', err);
      }
    );
    
    this.http.srDashboardGet('getcoddata').subscribe(
      (res: any) => {
        this._statuses.set(res.data);
        this.cdr.markForCheck();
      },
      (err: any) => {
        console.error('Error fetching statuses', err);
      }
    );
  }

  getShippingOverviewCombinedData() {
    this.http.srDashboardGet('2.0/shipment/details').subscribe(
      (res: any) => {
        this._shippingData.set(res.data.shipping_data);
        this._ndrData.set(res.data.ndr_data);
        this.cdr.markForCheck();
      },
      (err: any) => {
        console.error('Error fetching shipping overview', err);
      }
    );
  }

  getDeliveryPerformance() {
    this.http.srDashboardGet('delivery-performance').subscribe(
      (res: any) => {
        this.deliveryDonutData = res.data;
        this.createDeliveryPerformanceDonutChart(res.data);
        this.cdr.markForCheck();
      },
      (err: any) => {
        console.error('Error fetching delivery performance', err);
      }
    );
  }

  createDonutChart(item: any) {
    const keys = Object.keys(item);
    const length = keys.length;
    const labels: string[] = [];
    const data: number[] = [];
    const colors = [
      'rgb(163, 161, 251)',
      'rgb(96, 235, 160)',
      'rgb(252, 160, 118)',
      'rgb(244, 122, 194)',
      'rgb(40, 95, 219)',
      'rgb(255, 102, 102)',
    ];

    for (let i = 0; i < length; i++) {
      labels.push(item[keys[i]].courier_name);
      data.push(item[keys[i]].total);
    }

    this.courierChartData = {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: colors.slice(0, length),
        borderWidth: 2,
        borderColor: '#fff'
      }]
    };

    this.courierChartOptions = {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: true,
          position: 'bottom',
          labels: {
            color: 'rgb(51, 51, 51)',
            font: {
              size: 12,
              weight: 'bold'
            }
          }
        },
        tooltip: {
          enabled: true,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          borderColor: '#ccc',
          borderWidth: 1,
          titleColor: '#000',
          bodyColor: '#000',
          callbacks: {
            label: (context: any) => {
              const label = context.label || '';
              const value = this.convertIndianFormat(context.parsed);
              const percentage = ((context.parsed / context.dataset.data.reduce((a: number, b: number) => a + b, 0)) * 100).toFixed(1);
              return `${label}: ${value} (${percentage}%)`;
            }
          }
        }
      }
    };
  }

  createShipmentStatusDonutChart(item: any) {
    console.log('Creating Shipment Status Chart with data:', item);
    
    const colors = [
      'rgb(163, 161, 251)',
      'rgb(96, 235, 160)',
      'rgb(40, 95, 219)',
      'rgb(252, 160, 118)',
      'rgb(244, 122, 194)',
    ];

    const labels = ['Delivered', 'Intransit', 'Undelivered', 'RTO', 'Lost/Damaged'];
    const data = [
      item.delivered || 0,
      item.in_transit || 0,
      item.undelivered || 0,
      item.rto || 0,
      item.lost || 0
    ];

    console.log('Chart data:', { labels, data });

    this.shipmentChartData = {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: colors,
        borderWidth: 2,
        borderColor: '#fff'
      }]
    };

    this.shipmentChartOptions = {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: true,
          position: 'bottom',
          labels: {
            color: 'rgb(51, 51, 51)',
            font: {
              size: 12,
              weight: 'bold'
            }
          }
        },
        tooltip: {
          enabled: true,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          borderColor: '#ccc',
          borderWidth: 1,
          titleColor: '#000',
          bodyColor: '#000',
          callbacks: {
            label: (context: any) => {
              const label = context.label || '';
              const value = this.convertIndianFormat(context.parsed);
              const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
              const percentage = total > 0 ? ((context.parsed / total) * 100).toFixed(1) : '0';
              return `${label}: ${value} (${percentage}%)`;
            }
          }
        }
      }
    };

    console.log('Shipment chart created:', this.shipmentChartData);
  }

  createDeliveryPerformanceDonutChart(item: any) {
    const colors = ['rgb(163, 161, 251)', 'rgb(252, 160, 118)'];
    
    const labels = ['Ontime Deliveries', 'Late Deliveries'];
    const data = [
      item.ontime_delivery?.count || 0,
      item.late_delivery?.count || 0
    ];

    this.deliveryChartData = {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: colors,
        borderWidth: 2,
        borderColor: '#fff'
      }]
    };

    this.deliveryChartOptions = {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: true,
          position: 'bottom',
          labels: {
            color: 'rgb(51, 51, 51)',
            font: {
              size: 12,
              weight: 'bold'
            }
          }
        },
        tooltip: {
          enabled: true,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          borderColor: '#ccc',
          borderWidth: 1,
          titleColor: '#000',
          bodyColor: '#000',
          callbacks: {
            label: (context: any) => {
              const label = context.label || '';
              const value = this.convertIndianFormat(context.parsed);
              const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
              const percentage = total > 0 ? ((context.parsed / total) * 100).toFixed(1) : '0';
              return `${label}: ${value} (${percentage}%)`;
            }
          }
        }
      }
    };
  }

  convertIndianFormat(amt: any) {
    const amount = parseInt(amt);
    if (!isNaN(amount)) {
      let result = amount.toString().split('.');
      var lastThree = result[0].substring(result[0].length - 3);
      var otherNumbers = result[0].substring(0, result[0].length - 3);
      if (otherNumbers != '') lastThree = ',' + lastThree;
      var output = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;

      if (result.length > 1) {
        output += '.' + result[1];
      }
      return output;
    } else {
      return;
    }
  }

  numFormat(num: number) {
    let val: any = Math.abs(num);
    if (val < 1000) {
      return val;
    } else if (val >= 10000000) {
      val = (val / 10000000).toFixed(1) + 'Cr';
    } else if (val >= 100000) {
      val = (val / 100000).toFixed(1) + 'L';
    } else if (val >= 1000) {
      val = (val / 1000).toFixed(1) + 'K';
    }
    return val;
  }

  switchDashboard(event: Event) {
    const type = (event.target as HTMLSelectElement).value;
    this.getStateDataPinot(type);
  }

  mapStateWithKey(state: string) {
    if (state == 'DELHI') return 'nct of delhi';
    if (state == 'ARUNACHAL PRADESH') return 'arunanchal pradesh';
    else return state;
  }

  mapCalculation(type: string, res: any) {
    this._mapData.set(res.data.state_wise_data);
    console.log('Map data loaded:', this.mapData);
    console.log('Map data available:', this.isMapDataAvailable());
    
    let items = res.data.state_wise_data;
    let format = '';
    let keys = Object.keys(res.data.state_wise_data);
    let length = keys.length;
    console.log('Number of states:', length);
    let total_order = 0;
    let total_rto = 0;

    for (let i = 0; i < length; i++) {
      total_order += items[keys[i]].order_count;
      total_rto += items[keys[i]].rto_count;
    }

    if (type == 'Order') {
      var data = [];
      for (var i = 0; i < length && total_order > 0; i++) {
        data.push({
          'hc-key': this.mapStateWithKey(items[keys[i]].delivery_state).toLowerCase(),
          value: items[keys[i]].order_count,
          custom: {
            total: this.convertIndianFormat(items[keys[i]].order_count),
            revenue: this.convertIndianFormat(items[keys[i]].revenue),
          },
          revenue: items[keys[i]].revenue,
          revenue_percentage: items[keys[i]].revenue_percentage,
          order_count_percentage: items[keys[i]].order_count_percentage,
        });
      }
      format =
        '<table><tr><td>{point.name}</td><td></td></tr><tr> <td>Orders Count:</td><td align="right">{point.custom.total} ({point.order_count_percentage:.1f}%)</td></tr><tr> <td>Revenue:</td><td align="right"><i class="fa fa-inr" aria-hidden="true"></i>₹{point.custom.revenue} ({point.revenue_percentage:.1f}%)</td></tr></table>';
      if (this.mapData && this.mapData.length > 0) {
        this.createMapChart(data, type, format);
      }
    } else {
      var data = [];
      for (var i = 0; i < length && total_rto > 0; i++) {
        data.push({
          'hc-key': this.mapStateWithKey(items[keys[i]].delivery_state).toLowerCase(),
          value: items[keys[i]].rto_count,
          custom: {
            total: this.convertIndianFormat(items[keys[i]].rto_count),
            revenue: this.convertIndianFormat(items[keys[i]].revenue),
          },
          revenue: items[keys[i]].revenue,
          revenue_percentage: items[keys[i]].revenue_percentage,
          order_count_percentage: items[keys[i]].rto_count_percentage,
        });
      }
      format =
        '<table> <tr> <td>{point.name}</td><td></td></tr><tr> <td>RTO Count:</td><td align="right">{point.custom.total} ({point.order_count_percentage}%)</td></tr></table>';
      if (this.mapData && this.mapData.length > 0) {
        this.createMapChart(data, type, format);
      }
    }
  }

  async createMapChart(data: any, type: any, format: any) {
    // Map functionality will be added in future
    console.log('Map data:', { data, type, format });
  }


  newWebVersionKyc() {
    window.location.href = '/sellers/kyc';
  }

  isPinotshipingDataDataNotEmpty(): boolean {
    if (
      this.pinotData &&
      this.pinotData.shipment_details &&
      this.pinotData.shipment_details.length > 0 &&
      Object.keys(this.pinotData.shipment_details[0])?.length > 0
    ) {
      for (const key in this.pinotData.shipment_details[0]) {
        if (this.pinotData.shipment_details[0][key] > 0) {
          return true;
        }
      }
      return false;
    } else {
      return false;
    }
  }

  isdeliveryDonutDataNotEmpty(): boolean {
    if (this.deliveryDonutData && Object.keys(this.deliveryDonutData)?.length > 0) {
      return true;
    } else {
      return false;
    }
  }

  isMapDataAvailable(): boolean {
    return this.mapData && Object.keys(this.mapData).length > 0;
  }
}
