import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA, ChangeDetectionStrategy, ChangeDetectorRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpService } from '../services/http-service.service';
import { ToastrService } from '../services/toastr.service';
import { AnalyticsService } from '../services/analytics.service';
import { DashboardFiltersComponent } from '../shared/components/dashboard-filters/dashboard-filters.component';
import { FilterData, FilterValues, DateRange } from '../shared/components/dashboard-filters/dashboard-filters.component';
import moment from 'moment';
import { BaseChartDirective } from 'ng2-charts';
import { Chart, ChartConfiguration, ChartData, ArcElement, Tooltip, Legend, DoughnutController, PieController, BarElement, CategoryScale, LinearScale, BarController, LineElement, PointElement, LineController } from 'chart.js';

@Component({
  selector: 'app-ndr',
  standalone: true,
  imports: [CommonModule, FormsModule, DashboardFiltersComponent, BaseChartDirective],
  templateUrl: './ndr.html',
  styleUrl: './ndr.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class NdrComponent implements OnInit {
  startDate: any = moment().subtract(30, 'days').format('YYYY-MMM-DD');
  endDate: any = moment().subtract(1, 'days').format('YYYY-MMM-DD');
  
  allNdrData: any = {
    ndr_raised_count: 0,
    ndr_action_required: 0,
    ndr_delivered_count: 0,
    ndr_rto_count: 0,
    shipment_count: 0,
  };
  
  // Chart.js properties
  public doughnutType: 'doughnut' = 'doughnut' as const;
  public barType: 'bar' = 'bar' as const;
  
  // Signals for heavy state with getters for template compatibility
  private _ndrSplit = signal<any[]>([]);
  showNdrSplitGraph: any;
  private _ndrDeliveredAttempt = signal<any>({});
  private _ndrStatusData = signal<any>({});
  private _ndrReasonData = signal<any[]>([]);
  private _ndrResponseData = signal<any>(null);
  private _ndrSellerBuyerResponse = signal<any>({});
  private _ndrFunnel = signal<any>(null);
  ndr_split_data: ChartData<'doughnut'> = { labels: [], datasets: [] };
  ndr_split_options: ChartConfiguration<'doughnut'>['options'] = {};
  showNdrStatusGraph: any;
  ndrStatusDataChart: any;
  ndr_status_data: ChartData<'bar'> = { labels: [], datasets: [] };
  ndr_status_options: ChartConfiguration<'bar'>['options'] = {};
  totalNdrRaised: any;
  ndrResponseSeller: any;
  ndrResponseSellerPositive: any;
  ndrResponseBuyer: any;
  ndrResponseBuyerPositive: any;
  ndr_delivery_attempt_data: ChartData = { labels: [], datasets: [] };
  ndr_delivery_attempt_options: ChartConfiguration['options'] = {};
  ndrDeliveryAttemptChart: any;
  ndrSellerResponseDataChart: any;
  ndrBuyerResponseDataChart = false;
  ndr_seller_response_data: ChartData = { labels: [], datasets: [] };
  ndr_seller_response_options: ChartConfiguration['options'] = {};
  ndr_buyer_response_data: ChartData = { labels: [], datasets: [] };
  ndr_buyer_response_options: ChartConfiguration['options'] = {};
  private _ndrSuccessData = signal<any>(null);
  showHideCourier = false;
  // Compatibility getters
  get ndrSplit() { return this._ndrSplit(); }
  get ndrDeliveredAttempt() { return this._ndrDeliveredAttempt(); }
  get ndrStatusData() { return this._ndrStatusData(); }
  get ndrReasonData() { return this._ndrReasonData(); }
  get ndrResponseData() { return this._ndrResponseData(); }
  get ndrSellerBuyerResponse() { return this._ndrSellerBuyerResponse(); }
  get ndrFunnel() { return this._ndrFunnel(); }
  get ndrSuccessData() { return this._ndrSuccessData(); }

  filterData: FilterData = {
    zone: [],
    courier: []
  };
  
  currentFilterValues: FilterValues = {
    zones: [],
    courier: [],
    payment: [],
    shipment: ''
  };

  constructor(
    private http: HttpService,
    private toastr: ToastrService,
    private analyticsService: AnalyticsService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    Chart.register(ArcElement, Tooltip, Legend, DoughnutController, PieController, BarElement, CategoryScale, LinearScale, BarController, LineElement, PointElement, LineController);
    this.initializeChartOptions();
    this.callAllFunctions();
  }

  onDateRangeChange(range: DateRange): void {
    this.startDate = moment(range.start).format('YYYY-MMM-DD');
    this.endDate = moment(range.end).format('YYYY-MMM-DD');
    this.callAllFunctions();
  }

  onFilterChange(filterValues: FilterValues): void {
    this.currentFilterValues = filterValues;
    this.callAllFunctions();
  }

  clearFilter(): void {
    this.currentFilterValues = {
      zones: [],
      courier: [],
      payment: [],
      shipment: ''
    };
    this.callAllFunctions();
  }

  callAllFunctions(): void {
    this.ndrAllMatric();
    this.getAllResponse();
    this.ndrFunnell();
    this.getNdrDetailedCount();
    this.ndrSuccess();
  }

  initializeChartOptions(): void {
    // Initialize with empty Chart.js data structures
    this.ndr_delivery_attempt_data = {
      labels: [],
      datasets: []
    };
    this.ndr_delivery_attempt_options = {
      responsive: true,
      plugins: { 
        legend: { display: true, position: 'top', labels: { boxWidth: 12, font: { size: 12 } } },
        tooltip: { enabled: true }
      },
      scales: {
        x: { beginAtZero: true },
        y: { beginAtZero: true }
      }
    };
    
    this.ndr_seller_response_data = {
      labels: [],
      datasets: []
    };
    this.ndr_seller_response_options = {
      responsive: true,
      plugins: { 
        legend: { display: true, position: 'top', labels: { boxWidth: 12, font: { size: 12 } } },
        tooltip: { enabled: true }
      },
      scales: {
        x: { beginAtZero: true },
        y: { beginAtZero: true }
      }
    };
    
    this.ndr_buyer_response_data = {
      labels: [],
      datasets: []
    };
    this.ndr_buyer_response_options = {
      responsive: true,
      plugins: { 
        legend: { display: true, position: 'top', labels: { boxWidth: 12, font: { size: 12 } } },
        tooltip: { enabled: true }
      },
      scales: {
        x: { beginAtZero: true },
        y: { beginAtZero: true }
      }
    };
  }

  convertIndianFormat(amt: any) {
    const amount = parseInt(amt);
    if (!isNaN(amount)) {
      const result = amount.toString().split('.');
      let lastThree = result[0].substring(result[0].length - 3);
      const otherNumbers = result[0].substring(0, result[0].length - 3);
      if (otherNumbers != '') lastThree = ',' + lastThree;
      let output =
        otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;

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

  ndrAllMatric() {
    const data = {
      start_date: this.startDate,
      end_date: this.endDate,
      courier_mode: this.currentFilterValues.shipment || '',
      courier: this.currentFilterValues.courier?.join(',') || '',
      payment_method: this.currentFilterValues.payment?.join(',') || '',
      zones: this.currentFilterValues.zones?.join(',') || '',
    };
    
    this.http.srDashboardGet('2.0/ndr/reasons', data).subscribe(
      (res: any) => {
        this.getActionRequiredCount();
        this.getShipmentsCount();
        this.allNdrData.ndr_raised_count = res.data.overall.ndr_raised_count;
        this.allNdrData.ndr_delivered_count = res.data.overall.ndr_delivered_count;
        this.allNdrData.ndr_rto_count = res.data.overall.ndr_rto_count;

        this._ndrSplit.set(res.data.reason_chart);
        if (this._ndrSplit().length) {
          this.showNdrSplitGraph = true;
          this.createndrReasonSplitChart(this._ndrSplit());
        } else {
          this.showNdrSplitGraph = false;
        }

        this._ndrDeliveredAttempt.set(res.data.delivery_attempt);
        this.makeNDRDeliveryAttemptChart();

        this._ndrStatusData.set(res.data.status_chart);
        this.showNdrStatusGraph = true;
        this.makeNDRStatusChart();

        this._ndrReasonData.set(res.data.reason_wise_split);
        this.cdr.markForCheck();
      },
      (err) => {
        this.toastr.error(err.error.message);
        this.cdr.markForCheck();
      }
    );
  }

  getActionRequiredCount() {
    const data = {
      start_date: this.startDate,
      end_date: this.endDate,
      courier_mode: this.currentFilterValues.shipment || '',
      courier: this.currentFilterValues.courier?.join(',') || '',
      payment_method: this.currentFilterValues.payment?.join(',') || '',
      zones: this.currentFilterValues.zones?.join(',') || '',
    };
    
    this.http.srDashboardGet('2.0/ndr/action-required', data).subscribe(
      (res: any) => {
        this.allNdrData.ndr_action_required = res.data.ndr_action_required;
        this.cdr.markForCheck();
      },
      (err) => {
        this.toastr.error(err.error.message);
        this.cdr.markForCheck();
      }
    );
  }

  getAllResponse() {
    const data = {
      start_date: this.startDate,
      end_date: this.endDate,
      courier_mode: this.currentFilterValues.shipment || '',
      courier: this.currentFilterValues.courier?.join(',') || '',
      payment_method: this.currentFilterValues.payment?.join(',') || '',
      zones: this.currentFilterValues.zones?.join(',') || '',
    };
    
    this.http.srDashboardGet('2.0/ndr/all-response', data).subscribe(
      (res: any) => {
        this._ndrResponseData.set(res.data.matrix);
        this._ndrSellerBuyerResponse.set(res.data.grouped);
        this.makeSellerBuyerResponseChart();
        this.cdr.markForCheck();
      },
      (err) => {
        this.toastr.error(err.error.message);
        this.cdr.markForCheck();
      }
    );
  }

  getShipmentsCount() {
    const data = {
      start_date: this.startDate,
      end_date: this.endDate,
      courier_mode: this.currentFilterValues.shipment || '',
      courier: this.currentFilterValues.courier?.join(',') || '',
      payment_method: this.currentFilterValues.payment?.join(',') || '',
      zones: this.currentFilterValues.zones?.join(',') || '',
    };
    
    this.http.srDashboardGet('2.0/ndr/shipments', data).subscribe(
      (res: any) => {
        this.allNdrData.shipment_count = res.data.shipment_count;
        this.cdr.markForCheck();
      },
      (err) => {
        this.toastr.error(err.error.message);
        this.cdr.markForCheck();
      }
    );
  }

  ndrFunnell() {
    const data = {
      start_date: this.startDate,
      end_date: this.endDate,
      courier_mode: this.currentFilterValues.shipment || '',
      courier: this.currentFilterValues.courier?.join(',') || '',
      payment_method: this.currentFilterValues.payment?.join(',') || '',
      zones: this.currentFilterValues.zones?.join(',') || '',
    };
    
    this.http.srDashboardGet('2.0/getndrfunnel', data).subscribe(
      (res: any) => {
        this._ndrFunnel.set(res.data);
        this.cdr.markForCheck();
      },
      (err) => {
        this.toastr.error(err.error.message);
        this.cdr.markForCheck();
      }
    );
  }

  getNdrDetailedCount() {
    const data = {
      start_date: this.startDate,
      end_date: this.endDate,
      courier_mode: this.currentFilterValues.shipment || '',
      courier: this.currentFilterValues.courier?.join(',') || '',
      payment_method: this.currentFilterValues.payment?.join(',') || '',
      zones: this.currentFilterValues.zones?.join(',') || '',
    };
    
    this.http.srDashboardGet('2.0/ndr/detailed', data).subscribe(
      (res: any) => {
        this.totalNdrRaised = res.data.overall;
        this.ndrResponseSeller = res.data.seller.overall;
        this.ndrResponseSellerPositive = res.data.seller.positive;
        this.ndrResponseBuyer = res.data.buyer.overall;
        this.ndrResponseBuyerPositive = res.data.buyer.positive;
        this.cdr.markForCheck();
      },
      (err) => {
        this.toastr.error(err.error.message);
        this.cdr.markForCheck();
      }
    );
  }

  ndrSuccess() {
    const data = {
      start_date: this.startDate,
      end_date: this.endDate,
      courier_mode: this.currentFilterValues.shipment || '',
      courier: this.currentFilterValues.courier?.join(',') || '',
      payment_method: this.currentFilterValues.payment?.join(',') || '',
      zones: this.currentFilterValues.zones?.join(',') || '',
    };
    
    this.http.srDashboardGet('2.0/ndrSuccess', data).subscribe(
      (res: any) => {
        this._ndrSuccessData.set(res.data);
        this.cdr.markForCheck();
      },
      (err) => {
        this.toastr.error(err.error.message);
        this.cdr.markForCheck();
      }
    );
  }

  createndrReasonSplitChart(item: string | any[]) {
    if (item.length > 0) {
      const length = item.length;
      const chartData = [];
      const clr = [
        //blue
        'rgb(163, 161, 251)',
        //green
        'rgb(96, 235, 160)',
        //orange
        'rgb(252, 160, 118)',
        //pink
        'rgb(244, 122, 194)',
        //shirocket blue
        'rgb(40, 95, 219)',
        //red
        'rgb(255, 102, 102)',
      ];

      const posCenter = length < 3 ? '45%' : length < 4 ? '48%' : '50%';
      let totalNdrSplit = 0;
      for (let i = 0; i < length; i++) {
        const formatedData = {
          name: item[i].reason,
          y: item[i].count ? item[i].count : item[i].total,
          color: clr[i],
          dataLabels: {
            enabled: false,
            format: '{point.percentage:.1f}',
            borderWidth: 0,
          },
          custom: {
            axis_y: this.convertIndianFormat(
              item[i].count ? item[i].count : item[i].total
            ),
            percent_custom: 0,
          },
        };
        totalNdrSplit =
          totalNdrSplit + (item[i].count ? item[i].count : item[i].total);
        chartData.push(formatedData);
      }
      for (let i = 0; i < length; i++) {
        chartData[i].y = (chartData[i].y / totalNdrSplit) * 100;
        chartData[i].custom.percent_custom = chartData[i].y.toFixed(1);
        if (chartData[i].y < 1) {
          chartData[i].y = 1;
        }
      }
      
      const labels = chartData.map((d: any) => d.name);
      const data = chartData.map((d: any) => d.y);
      const colors = chartData.map((d: any) => d.color);
      
      this.ndr_split_data = {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: colors,
          borderWidth: 0
        }]
      };
      this.ndr_split_options = {
        responsive: true,
        cutout: '65%',
        plugins: { 
          legend: { display: true, position: 'bottom', labels: { boxWidth: 12, font: { size: 12 } } },
          tooltip: { enabled: true }
        }
      };
    } else {
      this.showNdrSplitGraph = false;
    }
  }

  makeNDRDeliveryAttemptChart() {
    if (this.ndrDeliveredAttempt.length != 0) {
      const keys = Object.keys(this.ndrDeliveredAttempt);
      const length = keys.length;

      const ndrRaisedData = [];
      const ndrDelivereddData = [];

      for (let i = 0; i < length; i++) {
        //Raised
        const ndrRaisedDataVal = this.ndrDeliveredAttempt[keys[i]].ndr_raised;
        ndrRaisedData.push({
          y: ndrRaisedDataVal ? ndrRaisedDataVal : 0,
          custom: this.convertIndianFormat(
            ndrRaisedDataVal ? ndrRaisedDataVal : 0
          ),
        });

        //Delivered
        const ndrDelivereddDataVal = this.ndrDeliveredAttempt[keys[i]].attempts;
        ndrDelivereddData.push({
          y: ndrDelivereddDataVal ? ndrDelivereddDataVal : 0,
          custom: this.convertIndianFormat(
            ndrDelivereddDataVal ? ndrDelivereddDataVal : 0
          ),
        });
      }

      this.ndrDeliveryAttemptChart =
        ndrRaisedData.length || ndrDelivereddData ? true : false;
      
      if (this.ndrDeliveryAttemptChart) {
        const labels = keys.map((key: string) => key);
        const raisedValues = ndrRaisedData.map((item: any) => item.y);
        const deliveredValues = ndrDelivereddData.map((item: any) => item.y);
        
        this.ndr_delivery_attempt_data = {
          labels: labels,
          datasets: [
            {
              label: 'NDR Raised',
              data: raisedValues,
              type: 'bar',
              backgroundColor: 'rgb(96, 235, 160)',
              borderWidth: 0
            },
            {
              label: 'Delivery Attempt',
              data: deliveredValues,
              type: 'line',
              backgroundColor: 'rgb(252, 160, 118)',
              borderColor: 'rgb(252, 160, 118)',
              borderWidth: 2,
              fill: false,
              tension: 0.1
            }
          ]
        };
        this.ndr_delivery_attempt_options = {
          responsive: true,
          plugins: { 
            legend: { display: true, position: 'top', labels: { boxWidth: 12, font: { size: 12 } } },
            tooltip: { enabled: true }
          },
          scales: {
            x: { beginAtZero: true },
            y: { beginAtZero: true }
          }
        };
      }
    } else {
    }
  }

  makeNDRStatusChart() {

    if (this.ndrStatusData.length != 0) {
      const keys = Object.keys(this.ndrStatusData);
      const length = keys.length;
      const clr = [
        //yellow
        'rgb(253, 225, 123)',
        //orange
        'rgb(252, 160, 118)',

        //bllue
        'rgb(163, 161, 251)',
        //green
        'rgb(96, 235, 160)',
      ];

      const formatedSeries: any = [
        {
          name: 'Lost/Damaged',
          data: [],
        },
        {
          name: 'Pending',
          data: [],
        },
        {
          name: 'RTO',
          data: [],
        },
        {
          name: 'Delivered',
          data: [],
        },
      ];
      for (let i = 0; i < length; i++) {
        const lddData = this.ndrStatusData[keys[i]].lost_damanged;
        const peidingData = this.ndrStatusData[keys[i]].pending_count;
        const rtoData = this.ndrStatusData[keys[i]].rto_count;
        const deliveredData = this.ndrStatusData[keys[i]].delivered_count;

        const allTotalNdr = lddData + peidingData + rtoData + deliveredData;

        //Lost Damaged Destroyed
        formatedSeries[0].data.push({
          y: lddData ? lddData : 0,
          custom: this.convertIndianFormat(lddData ? lddData : 0),
          totalPercent: ((lddData / allTotalNdr) * 100).toFixed(1),
        });
        //Pending
        formatedSeries[1].data.push({
          y: peidingData ? peidingData : 0,
          custom: this.convertIndianFormat(peidingData ? peidingData : 0),
          totalPercent: ((peidingData / allTotalNdr) * 100).toFixed(1),
        });

        //Rto
        formatedSeries[2].data.push({
          y: rtoData ? rtoData : 0,
          custom: this.convertIndianFormat(rtoData ? rtoData : 0),
          totalPercent: ((rtoData / allTotalNdr) * 100).toFixed(1),
        });

        //Delivered
        formatedSeries[3].data.push({
          y: deliveredData ? deliveredData : 0,
          custom: this.convertIndianFormat(deliveredData ? deliveredData : 0),
          totalPercent: ((deliveredData / allTotalNdr) * 100).toFixed(1),
        });
      }

      this.ndrStatusDataChart = this.ndrStatusData.length;
      if (this.ndrStatusDataChart !== 0) {
        const labels = keys.map((key: string) => key);
        const lostDamagedData = formatedSeries[0].data.map((item: any) => item.y);
        const pendingData = formatedSeries[1].data.map((item: any) => item.y);
        const rtoData = formatedSeries[2].data.map((item: any) => item.y);
        const deliveredData = formatedSeries[3].data.map((item: any) => item.y);
        
        this.ndr_status_data = {
          labels: labels,
          datasets: [
            {
              label: 'Lost/Damaged',
              data: lostDamagedData,
              backgroundColor: 'rgb(253, 225, 123)',
              borderWidth: 0
            },
            {
              label: 'Pending',
              data: pendingData,
              backgroundColor: 'rgb(252, 160, 118)',
              borderWidth: 0
            },
            {
              label: 'RTO',
              data: rtoData,
              backgroundColor: 'rgb(163, 161, 251)',
              borderWidth: 0
            },
            {
              label: 'Delivered',
              data: deliveredData,
              backgroundColor: 'rgb(96, 235, 160)',
              borderWidth: 0
            }
          ]
        };
        this.ndr_status_options = {
          responsive: true,
          plugins: { 
            legend: { display: true, position: 'top', labels: { boxWidth: 12, font: { size: 12 } } },
            tooltip: { enabled: true }
          },
          scales: { 
            x: { stacked: false }, 
            y: { stacked: false, beginAtZero: true }
          }
        };
      }
    } else {
      this.showNdrStatusGraph = false;
    }
  }

  makeSellerBuyerResponseChart() {
    if (this.ndrSellerBuyerResponse.length != 0) {
      const keys = Object.keys(this.ndrSellerBuyerResponse);
      const length = keys.length;

      const ndrData: any = [];
      const ndrSellerResponsedData: any = [];
      const ndrSellerPositiveResponsedData: any = [];
      const ndrBuyerResponsedData: any = [];
      const ndrBuyerPositiveResponsedData: any = [];

      this.ndrSellerResponseDataChart = false;
      this.ndrBuyerResponseDataChart = false;

      for (let i = 0; i < length; i++) {
        //Raised
        const ndrDataVal = this.ndrSellerBuyerResponse[keys[i]].ndr_raised;
        ndrData.push({
          y: ndrDataVal ? ndrDataVal : 0,
          custom: this.convertIndianFormat(ndrDataVal ? ndrDataVal : 0),
        });

        //Seller Response
        const ndrSellerResponseDataVal =
          this.ndrSellerBuyerResponse[keys[i]].seller_response;
        ndrSellerResponsedData.push({
          y: ndrSellerResponseDataVal ? ndrSellerResponseDataVal : 0,
          custom: this.convertIndianFormat(
            ndrSellerResponseDataVal ? ndrSellerResponseDataVal : 0
          ),
        });

        //Seller Positive Response
        const ndrSellerPositiveResponsedDataVal =
          this.ndrSellerBuyerResponse[keys[i]].seller_response_success;
        ndrSellerPositiveResponsedData.push({
          y: ndrSellerPositiveResponsedDataVal
            ? ndrSellerPositiveResponsedDataVal
            : 0,
          custom: ndrSellerPositiveResponsedDataVal
            ? ndrSellerPositiveResponsedDataVal
            : 0,
        });

        //Buyer Response
        const ndrBuyerResponsedDataVal =
          this.ndrSellerBuyerResponse[keys[i]].buyer_response;
        ndrBuyerResponsedData.push({
          y: ndrBuyerResponsedDataVal ? ndrBuyerResponsedDataVal : 0,
          custom: this.convertIndianFormat(
            ndrBuyerResponsedDataVal ? ndrBuyerResponsedDataVal : 0
          ),
        });

        //Buyer Positive Response
        const ndrBuyerPositiveResponsedDataVal =
          this.ndrSellerBuyerResponse[keys[i]].buyer_response_success;
        ndrBuyerPositiveResponsedData.push({
          y: ndrBuyerPositiveResponsedDataVal
            ? ndrBuyerPositiveResponsedDataVal
            : 0,
          custom: this.convertIndianFormat(
            ndrBuyerPositiveResponsedDataVal
              ? ndrBuyerPositiveResponsedDataVal
              : 0
          ),
        });

        if (i == length - 1) {
          this.ndrSellerResponseDataChart =
            ndrData.length ||
            ndrSellerResponsedData.length ||
            ndrSellerPositiveResponsedData
              ? true
              : false;
          this.ndrBuyerResponseDataChart =
            ndrData.length ||
            ndrBuyerResponsedData.length ||
            ndrBuyerPositiveResponsedData
              ? true
              : false;
        }
      }

      if (this.ndrSellerResponseDataChart) {
        const labels = keys.map((key: string) => key);
        const ndrValues = ndrData.map((item: any) => item.y);
        const sellerResponseValues = ndrSellerResponsedData.map((item: any) => item.y);
        const sellerPositiveValues = ndrSellerPositiveResponsedData.map((item: any) => item.y);
        
        this.ndr_seller_response_data = {
          labels: labels,
          datasets: [
            {
              label: 'NDR',
              data: ndrValues,
              type: 'bar',
              backgroundColor: 'rgb(253, 225, 123)',
              borderWidth: 0
            },
            {
              label: 'Seller Response',
              data: sellerResponseValues,
              type: 'bar',
              backgroundColor: 'rgb(163, 161, 251)',
              borderWidth: 0
            },
            {
              label: 'Seller +ve Response',
              data: sellerPositiveValues,
              type: 'line',
              backgroundColor: 'rgb(96, 235, 160)',
              borderColor: 'rgb(96, 235, 160)',
              borderWidth: 2,
              fill: false,
              tension: 0.1
            }
          ]
        };
        this.ndr_seller_response_options = {
          responsive: true,
          plugins: { 
            legend: { display: true, position: 'top', labels: { boxWidth: 12, font: { size: 12 } } },
            tooltip: { enabled: true }
          },
          scales: {
            x: { beginAtZero: true },
            y: { beginAtZero: true }
          }
        };
      }

      if (this.ndrBuyerResponseDataChart) {
        const labels = keys.map((key: string) => key);
        const ndrValues = ndrData.map((item: any) => item.y);
        const buyerResponseValues = ndrBuyerResponsedData.map((item: any) => item.y);
        const buyerPositiveValues = ndrBuyerPositiveResponsedData.map((item: any) => item.y);
        
        this.ndr_buyer_response_data = {
          labels: labels,
          datasets: [
            {
              label: 'NDR',
              data: ndrValues,
              type: 'bar',
              backgroundColor: 'rgb(253, 225, 123)',
              borderWidth: 0
            },
            {
              label: 'Buyer Response',
              data: buyerResponseValues,
              type: 'bar',
              backgroundColor: 'rgb(252, 160, 118)',
              borderWidth: 0
            },
            {
              label: 'Buyer +ve Response',
              data: buyerPositiveValues,
              type: 'line',
              backgroundColor: 'rgb(163, 161, 251)',
              borderColor: 'rgb(163, 161, 251)',
              borderWidth: 2,
              fill: false,
              tension: 0.1
            }
          ]
        };
        this.ndr_buyer_response_options = {
          responsive: true,
          plugins: { 
            legend: { display: true, position: 'top', labels: { boxWidth: 12, font: { size: 12 } } },
            tooltip: { enabled: true }
          },
          scales: {
            x: { beginAtZero: true },
            y: { beginAtZero: true }
          }
        };
      }
    } else {
      // $scope.showNdrSellerBuyerResponseGraph = false;
    }
  }

  calculateSubTotal(...args: any[]): number {
    return args.reduce((sum, val) => (sum + (val || 0)), 0);
  }

  calculatendrSuccessTotal(...args: any[]): number {
    return args.reduce((sum, val) => (sum + (val || 0)), 0);
  }

  calculateCourierSuccessTotal(...args: any[]): number {
    return args.reduce((sum, val) => (sum + (val || 0)), 0);
  }

  toggleData(index: number): void {
    const element1 = document.getElementById('dashNdrP' + index);
    const element2 = document.getElementById('dashNdrPP' + index);
    
    if (element1 && element2) {
      const isVisible = element1.style.display !== 'none';
      element1.style.display = isVisible ? 'none' : 'block';
      element2.style.display = isVisible ? 'none' : 'block';
    }
  }
}
