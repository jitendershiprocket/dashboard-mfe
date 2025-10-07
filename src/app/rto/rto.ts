import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpService } from '../services/http-service.service';
import { ToastrService } from '../services/toastr.service';
import { DashboardFiltersComponent } from '../shared/components/dashboard-filters/dashboard-filters.component';
import { DateRange, FilterData, FilterValues } from '../shared/components/dashboard-filters/dashboard-filters.component';
import moment from 'moment';
import { BaseChartDirective } from 'ng2-charts';
import { Chart, ChartConfiguration, ChartData, ArcElement, Tooltip, Legend, DoughnutController, PieController, BarElement, CategoryScale, LinearScale, BarController, LineElement, PointElement, LineController } from 'chart.js';

@Component({
  selector: 'app-rto',
  standalone: true,
  imports: [CommonModule, FormsModule, DashboardFiltersComponent, BaseChartDirective],
  templateUrl: './rto.html',
  styleUrl: './rto.css',
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class RtoComponent implements OnInit {
  startDate: any = moment().subtract(30, 'days').format('YYYY-MMM-DD');
  endDate: any = moment().subtract(1, 'days').format('YYYY-MMM-DD');
  rto_stats: any;
  
  // Chart.js properties
  public lineType: 'line' = 'line' as const;
  public barType: 'bar' = 'bar' as const;
  public doughnutType: 'doughnut' = 'doughnut' as const;
  
  public rto_count_line_chart_data: ChartData<'line'> = { labels: [], datasets: [] };
  public rto_count_line_chart_options: ChartConfiguration<'line'>['options'] = {};
  
  rto_tab_raw_data: any;
  rto_tab_raw_hide_no_data: any;
  
  public rto_tab_status_chart_data: ChartData<'bar'> = { labels: [], datasets: [] };
  public rto_tab_status_chart_options: ChartConfiguration<'bar'>['options'] = {};
  
  rto_tab_reasons: any;
  noDataPieChart = false;
  
  public rto_reason_pie_chart_data: ChartData<'doughnut'> = { labels: [], datasets: [] };
  public rto_reason_pie_chart_options: ChartConfiguration<'doughnut'>['options'] = {};
  
  rto_tab_pincodes: any;
  rto_tab_top_cities: any;
  rto_tab_top_courier: any;
  rto_tab_top_customers: any;

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
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    Chart.register(ArcElement, Tooltip, Legend, DoughnutController, PieController, BarElement, CategoryScale, LinearScale, BarController, LineElement, PointElement, LineController);
    this.initializeChartOptions();
    this.getRtoStatsWithPinot();
    this.getRtoTabReasons();
    this.getRtoTabPincodes();
    this.getRtoTabTopCities();
    this.getRtoTabTopCourier();
    this.getRtoTabTopCustomers();
  }

  onDateRangeChange(range: DateRange): void {
    this.startDate = moment(range.start).format('YYYY-MMM-DD');
    this.endDate = moment(range.end).format('YYYY-MMM-DD');
    this.callAllFun();
  }

  onFilterChange(filterValues: FilterValues): void {
    this.currentFilterValues = { ...filterValues };
    this.callAllFun();
  }

  clearFilter(): void {
    this.currentFilterValues = {
      zones: [],
      courier: [],
      payment: [],
      shipment: ''
    };
    this.callAllFun();
  }

  convertIndianFormat(amt: any): string {
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
      return '';
    }
  }

  initializeChartOptions(): void {
    // Initialize RTO status chart with Chart.js
    this.rto_tab_status_chart_data = {
      labels: ['RTO Initiated', 'RTO Delivered', 'RTO Undelivered'],
      datasets: [
        {
          label: 'RTO Initiated',
          data: [1, 0, 0],
          backgroundColor: '#a3a1fb',
          borderWidth: 0
        },
        {
          label: 'RTO Delivered',
          data: [0, 4, 0],
          backgroundColor: '#5ee2a0',
          borderWidth: 0
        },
        {
          label: 'RTO Undelivered',
          data: [0, 0, 6],
          backgroundColor: '#ff8484',
          borderWidth: 0
        }
      ]
    };
    this.rto_tab_status_chart_options = {
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

    // Initialize RTO reason pie chart with Chart.js
    this.rto_reason_pie_chart_data = {
      labels: [],
      datasets: [{
        data: [],
        backgroundColor: [],
        borderWidth: 0
      }]
    };
    this.rto_reason_pie_chart_options = {
      responsive: true,
      cutout: '65%',
      plugins: {
        legend: { display: true, position: 'bottom', labels: { boxWidth: 12, font: { size: 12 } } },
        tooltip: { enabled: true }
      }
    };
  }

  getRtoStatsWithPinot(): void {
    const data = {
      start_date: this.startDate,
      end_date: this.endDate,
      courier_mode: this.currentFilterValues.shipment || '',
      courier: this.currentFilterValues.courier?.join(',') || '',
      payment_method: this.currentFilterValues.payment?.join(',') || '',
      zones: this.currentFilterValues.zones?.join(',') || '',
    };
    
    this.http.getPinot('dashboard/rto/summary', data).subscribe(
      (res) => {
        setTimeout(() => {
          this.rtoTabRtoStatusChart();
        }, 500);
        this.rto_stats = res.data.rto_summary;
        this.rto_tab_raw_data = res.data.rto_status_datewise;
        this.rtoTabRtoCountLineChart();
      },
      (err) => {
        this.toastr.error(err?.error?.message);
      }
    );
  }

  rtoTabRtoCountLineChart(): void {
    this.rto_tab_raw_hide_no_data =
      Object.keys(this.rto_tab_raw_data).length > 0 ? true : false;
    const rto_date = [];
    const rto_count = [];

    for (const key in this.rto_tab_raw_data) {
      rto_date.push(key);
      rto_count.push(this.rto_tab_raw_data[key].rto);
    }

    this.rto_count_line_chart_data = {
      labels: rto_date,
      datasets: [
        {
          label: 'RTO Count',
          data: rto_count,
          borderColor: '#a078ce',
          backgroundColor: 'rgba(160, 120, 206, 0.1)',
          borderWidth: 2,
          tension: 0.4,
          pointRadius: 4,
          pointBackgroundColor: '#a078ce'
        }
      ]
    };
    this.rto_count_line_chart_options = {
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

  rtoTabRtoStatusChart(): void {
    const rto_date = [];
    const rto_initiated = [];
    const rto_delivered = [];
    const rto_undelivered = [];

    for (const key in this.rto_tab_raw_data) {
      rto_date.push(key);
      rto_initiated.push(parseInt(this.rto_tab_raw_data?.[key]?.rto_initiated) || 0);
      rto_delivered.push(parseInt(this.rto_tab_raw_data?.[key]?.rto_delivered) || 0);
      rto_undelivered.push(parseInt(this.rto_tab_raw_data?.[key]?.rto_undelivered) || 0);
    }
   
    this.rto_tab_status_chart_data = {
      labels: rto_date,
      datasets: [
        {
          label: 'RTO Initiated',
          data: rto_initiated,
          backgroundColor: '#a3a1fb',
          borderWidth: 0
        },
        {
          label: 'RTO Delivered',
          data: rto_delivered,
          backgroundColor: '#5ee2a0',
          borderWidth: 0
        },
        {
          label: 'RTO Undelivered',
          data: rto_undelivered,
          backgroundColor: '#ff8484',
          borderWidth: 0
        }
      ]
    };
    this.rto_tab_status_chart_options = {
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


  getRtoTabReasons(): void {
    const data = {
      start_date: this.startDate,
      end_date: this.endDate,
      courier_mode: this.currentFilterValues.shipment || '',
      courier: this.currentFilterValues.courier?.join(',') || '',
      payment_method: this.currentFilterValues.payment?.join(',') || '',
      zones: this.currentFilterValues.zones?.join(',') || '',
    };
    
    this.http.srDashboardGet('2.0/rto/reasons', data).subscribe(
      (res) => {
        this.rto_tab_reasons = res.data.info;
        this.rtoTabRtoReasonsPieChart(this.rto_tab_reasons);
      },
      (err) => {
        this.toastr.error(err.error.message);
      }
    );
  }

  rtoTabRtoReasonsPieChart(item: any): void {
    if (item?.length > 0) {
      const keys = Object.keys(item);
      const length = keys.length;
      const labels = [];
      const data = [];
      const colors = [
        'rgb(173, 134, 252)',
        'rgb(252, 154, 108)',
        'rgb(96, 235, 160)',
        'rgb(243, 106, 194)',
        'rgb(47, 105, 219)',
        'rgb(58, 128, 13)',
        'rgb(93, 226, 160)',
        'rgb(255, 226, 121)',
        'rgb(244, 122, 195)',
        'rgb(163, 161, 251)',
      ];
      
      for (let i = 0; i < length; i++) {
        labels.push(item[keys[i]].reason_name);
        data.push(item[keys[i]].rto);
      }
      
      this.noDataPieChart = false;
      
      this.rto_reason_pie_chart_data = {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: colors.slice(0, length),
          borderWidth: 0
        }]
      };
      this.rto_reason_pie_chart_options = {
        responsive: true,
        cutout: '65%',
        plugins: {
          legend: { display: false },
          tooltip: { enabled: true }
        }
      };

    } else {
      this.noDataPieChart = true;
    }
  }

  getRtoTabPincodes(): void {
    const data = {
      start_date: this.startDate,
      end_date: this.endDate,
      courier_mode: this.currentFilterValues.shipment || '',
      courier: this.currentFilterValues.courier?.join(',') || '',
      payment_method: this.currentFilterValues.payment?.join(',') || '',
      zones: this.currentFilterValues.zones?.join(',') || '',
    };
    
    this.http.srDashboardGet('2.0/rto/top/pincodes', data).subscribe(
      (res) => {
        this.rto_tab_pincodes = res.data.pincodes;
      },
      (err) => {
        this.toastr.error(err.error.message);
      }
    );
  }

  getRtoTabTopCities(): void {
    const data = {
      start_date: this.startDate,
      end_date: this.endDate,
      courier_mode: this.currentFilterValues.shipment || '',
      courier: this.currentFilterValues.courier?.join(',') || '',
      payment_method: this.currentFilterValues.payment?.join(',') || '',
      zones: this.currentFilterValues.zones?.join(',') || '',
    };
    
    this.http.srDashboardGet('2.0/rto/top/cities', data).subscribe(
      (res) => {
        this.rto_tab_top_cities = res.data.cities;
      },
      (err) => {
        this.toastr.error(err.error.message);
      }
    );
  }

  getRtoTabTopCourier(): void {
    const data = {
      start_date: this.startDate,
      end_date: this.endDate,
      courier_mode: this.currentFilterValues.shipment || '',
      courier: this.currentFilterValues.courier?.join(',') || '',
      payment_method: this.currentFilterValues.payment?.join(',') || '',
      zones: this.currentFilterValues.zones?.join(',') || '',
    };
    
    this.http.srDashboardGet('2.0/rto/top/couriers', data).subscribe(
      (res) => {
        this.rto_tab_top_courier = res.data.couriers;
      },
      (err) => {
        this.toastr.error(err.error.message);
      }
    );
  }

  getRtoTabTopCustomers(): void {
    const data = {
      start_date: this.startDate,
      end_date: this.endDate,
      courier_mode: this.currentFilterValues.shipment || '',
      courier: this.currentFilterValues.courier?.join(',') || '',
      payment_method: this.currentFilterValues.payment?.join(',') || '',
      zones: this.currentFilterValues.zones?.join(',') || '',
    };
    
    this.http.srDashboardGet('2.0/rto/top/customers', data).subscribe(
      (res) => {
        this.rto_tab_top_customers = res.data.customers;
      },
      (err) => {
        this.toastr.error(err.error.message);
      }
    );
  }

  callAllFun(): void {
    this.getRtoStatsWithPinot();
    this.getRtoTabReasons();
    this.getRtoTabPincodes();
    this.getRtoTabTopCities();
    this.getRtoTabTopCourier();
    this.getRtoTabTopCustomers();
  }
}
