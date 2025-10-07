import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpService } from '../services/http-service.service';
import { ToastrService } from '../services/toastr.service';
import { DashboardFiltersComponent, FilterData, FilterValues, DateRange } from '../shared/components/dashboard-filters/dashboard-filters.component';
import { BaseChartDirective } from 'ng2-charts';
import { Chart, ChartConfiguration, ChartData, ArcElement, Tooltip, Legend, DoughnutController, PieController } from 'chart.js';
import moment from 'moment';

// Simple utility function to get user data
function getUser() {
  const userData = localStorage.getItem('ngStorage-USER');
  return userData ? JSON.parse(userData) : { company_id: null };
}

// Simple date utility
function getDateRange() {
  const today = moment();
  const thirtyDaysAgo = moment().subtract(30, 'days');
  return {
    start: thirtyDaysAgo.format('YYYY-MMM-DD'),
    end: today.subtract(1, 'days').format('YYYY-MMM-DD')
  };
}

interface IDateRange {
  start: string;
  end: string;
}

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, DashboardFiltersComponent, BaseChartDirective],
  templateUrl: './orders.html',
  styleUrls: ['./orders.css'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class OrdersComponent implements OnInit {
  title = 'Orders Dashboard';
  
  // Date range properties
  startDate: any = moment().subtract(30, 'days').format('YYYY-MMM-DD');
  endDate: any = moment().subtract(1, 'days').format('YYYY-MMM-DD');
  
  // Data properties
  orders: any[] = [];
  paginationData: any;
  pageSize = 1;
  isOrderData = false;
  locationsData: any[] = [];
  topCustomersData: any[] = [];
  topProductsData: any[] = [];
  
  // Chart.js properties
  public doughnutType: 'doughnut' = 'doughnut' as const;

  public prepaidChartData: ChartData<'doughnut'> = { labels: [], datasets: [] };
  public prepaidChartOptions: ChartConfiguration<'doughnut'>['options'] = {};

  public addressQualityChartData: ChartData<'doughnut'> = { labels: [], datasets: [] };
  public addressQualityChartOptions: ChartConfiguration<'doughnut'>['options'] = {};
  
  // Filter properties
  filterData: FilterData = {};
  currentFilterValues: FilterValues = {
    zones: [],
    courier: [],
    payment: [],
    shipment: ''
  };
  
  // Toggle properties
  customersToggleDate = '30_days';
  productToggleDate = '30_days';
  
  // State properties
  noPayments = false;
  noAddressData = false;

  constructor(
    private http: HttpService,
    private toastr: ToastrService
  ) {
    // Initialize date range
    const dateRange = getDateRange();
    this.startDate = dateRange.start;
    this.endDate = dateRange.end;
  }

  ngOnInit(): void {
    Chart.register(ArcElement, Tooltip, Legend, DoughnutController, PieController);
    this.initializeCharts();
    this.getFilterData();
    this.getCodDataPinot();
    this.getStaticsData();
    this.getTopCustomers();
    this.getTopProducts();
  }

  private initializeCharts(): void {
    this.prepaidChartData = {
      labels: ['Prepaid'],
      datasets: [{ data: [70.67], backgroundColor: ['rgb(163, 161, 251)'], borderWidth: 0 }]
    };
    this.prepaidChartOptions = {
      responsive: true,
      cutout: '60%',
      plugins: { legend: { display: true, position: 'bottom' }, tooltip: { enabled: true } }
    };

    this.addressQualityChartData = {
      labels: ['Valid', 'Ambiguous', 'Junk'],
      datasets: [{ data: [2, 5, 3], backgroundColor: ['#50B432', '#DDDF00', '#ED561B'], borderWidth: 0 }]
    };
    this.addressQualityChartOptions = {
      responsive: true,
      cutout: '60%',
      plugins: { legend: { display: true, position: 'bottom' }, tooltip: { enabled: true } }
    };
  }

  onDateRangeChange(range: DateRange): void {
    this.startDate = range.start;
    this.endDate = range.end;
    this.getCodDataPinot();
    this.getStaticsData();
  }

  onFilterChange(filterValues: FilterValues): void {
    this.currentFilterValues = filterValues;
    this.getCodDataPinot();
    this.getStaticsData();
  }

  getFilterData(): void {
    // Mock filter data - replace with actual API call
    this.filterData = {
      zone: [
        { value: 'A', display_value: 'Zone A' },
        { value: 'B', display_value: 'Zone B' },
        { value: 'C', display_value: 'Zone C' },
        { value: 'D', display_value: 'Zone D' },
        { value: 'E', display_value: 'Zone E' }
      ],
      courier: [
        { value: '1', display_value: 'Blue Dart' },
        { value: '2', display_value: 'DTDC' },
        { value: '3', display_value: 'Delhivery' }
      ],
      courier_type: [
        { value: 'prepaid', display_value: 'Prepaid' },
        { value: 'cod', display_value: 'COD' }
      ],
      courier_mode: [
        { value: 'surface', display_value: 'Surface' },
        { value: 'air', display_value: 'Air' }
      ]
    };
  }

  getCodDataPinot(): void {
    const data = {
      date_from: this.startDate,
      date_to: this.endDate,
      courier_mode: this.currentFilterValues.shipment == 'surface' ? 0 : this.currentFilterValues.shipment == 'air' ? 1 : '',
      courier_name: this.currentFilterValues.courier ? this.currentFilterValues.courier : '',
      payment_method: this.currentFilterValues.payment ? this.currentFilterValues.payment : '',
      zone: this.currentFilterValues.zones ? this.currentFilterValues.zones : '',
    };

    this.http.getPinot(`dashboard/orders/summary?current_page=${this.pageSize}`, data).subscribe(
      (res) => {
        this.locationsData = res?.data?.statewise_order_revenue || [];
        this.orders = res?.data?.orders_summary || [];
        this.paginationData = {
          "total": res?.total ?? 0,
          "count": res?.count ?? 0,
          "total_pages": null,
          "per_page": res?.per_page ?? 7,
          "current_page": res?.current_page ?? 1,
          "links": {
            "previous": res?.links?.previous ?? null,
            "next": res?.links?.next ?? null
          }
        };

        if (this.orders?.length > 0) {
          this.isOrderData = true;
        } else {
          this.isOrderData = false;
        }

        this.createPaymentModeChart(res?.data?.prepaid_vs_cod);
      },
      (err) => {
        this.isOrderData = false;
        this.toastr.error(err.error?.message || 'Error fetching orders data');
      }
    );
  }

  getStaticsData(): void {
    this.noPayments = false;
    this.noAddressData = false;
    
    const data = {
      date_from: this.startDate,
      date_to: this.endDate,
      courier_mode: this.currentFilterValues.shipment ? this.currentFilterValues.shipment : '',
      courier_name: this.currentFilterValues.courier ? this.currentFilterValues.courier : '',
      payment_method: this.currentFilterValues.payment ? this.currentFilterValues.payment : '',
      zone: this.currentFilterValues.zones ? this.currentFilterValues.zones : '',
    };

    this.http.srDashboardGet('orders', data).subscribe(
      (res) => {
        this.createAddressQualityChart(res?.data?.address_data);
      },
      (err) => {
        this.noPayments = true;
        this.noAddressData = true;
        this.toastr.error(err.error?.message || 'Error fetching statistics data');
      }
    );
  }

  getTopCustomers(): void {
    const data = {
      filter: this.customersToggleDate,
    };

    this.http.srDashboardGet('gettopcustomer', data).subscribe(
      (res) => {
        this.topCustomersData = res?.data || [];
      },
      (err) => {
        this.toastr.error(err.error?.message || 'Error fetching top customers data');
      }
    );
  }

  getTopProducts(): void {
    const data = {
      filter: this.productToggleDate,
    };

    this.http.srDashboardGet('gettopproducts', data).subscribe(
      (res) => {
        this.topProductsData = res?.data || [];
      },
      (err) => {
        this.toastr.error(err.error?.message || 'Error fetching top products data');
      }
    );
  }

  createPaymentModeChart(item: any): void {
    if (item?.prepaid) {
      const total = item.total_orders || 0;
      const prepaid = item.prepaid || 0;
      const cod = item.cod || 0;

      this.prepaidChartData = {
        labels: ['Prepaid', 'COD'],
        datasets: [{
          data: [prepaid, cod],
          backgroundColor: ['rgb(163, 161, 251)', 'rgb(94, 226, 160)'],
          borderWidth: 0
        }]
      };
      this.prepaidChartOptions = {
        responsive: true,
        cutout: '65%',
        plugins: {
          legend: { display: true, position: 'bottom' },
          tooltip: {
            enabled: true,
            callbacks: {
              label: (ctx) => {
                const label = ctx.label || '';
                const value = ctx.parsed as number;
                const percent = total > 0 ? ((value / total) * 100).toFixed(2) : '0.00';
                return `${label}: ${this.convertIndianFormat(value)} (${percent}%)`;
              }
            }
          }
        }
      };
    } else {
      this.noPayments = true;
    }
  }

  createAddressQualityChart(data: any): void {
    if (!data ||
      (parseFloat(data.valid_address) === 0 &&
        parseFloat(data.ambiguous_address) === 0 &&
        parseFloat(data.junk_address) === 0)) {
      this.noAddressData = true;
      return;
    }

    const valid = parseFloat(data.valid_address);
    const ambiguous = parseFloat(data.ambiguous_address);
    const junk = parseFloat(data.junk_address);

    this.addressQualityChartData = {
      labels: ['Valid', 'Ambiguous', 'Junk'],
      datasets: [{
        data: [valid, ambiguous, junk],
        backgroundColor: ['#50B432', '#DDDF00', '#ED561B'],
        borderWidth: 0
      }]
    };
    this.addressQualityChartOptions = {
      responsive: true,
      cutout: '65%',
      plugins: {
        legend: { display: true, position: 'bottom', labels: { boxWidth: 12, font: { size: 12 } } },
        tooltip: { enabled: true }
      }
    };
  }

  // Utility methods
  convertIndianFormat(amt: any): string {
    const amount = parseInt(amt);
    if (!isNaN(amount)) {
      let result = amount.toString().split('.');
      let lastThree = result[0].substring(result[0].length - 3);
      let otherNumbers = result[0].substring(0, result[0].length - 3);
      if (otherNumbers != '') lastThree = ',' + lastThree;
      let output =
        otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;

      if (result.length > 1) {
        output += '.' + result[1];
      }
      return output;
    } else {
      return '0';
    }
  }

  toTitleCase(str: string): string {
    if (str) return str.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
    else return '';
  }

  // Pagination methods
  previousBtn(): void {
    if (this.pageSize > 1) {
      this.pageSize = this.pageSize - 1;
      this.getCodDataPinot();
    }
  }

  nextBtn(): void {
    if (this.paginationData?.links?.next != null) {
      this.pageSize = this.pageSize + 1;
      this.getCodDataPinot();
    }
  }

  // Filter methods

  switchDate(event: Event): void {
    this.customersToggleDate = (event.target as HTMLSelectElement).value;
    this.getTopCustomers();
  }

  switchDateProducts(event: Event): void {
    this.productToggleDate = (event.target as HTMLSelectElement).value;
    this.getTopProducts();
  }

  clearFilter(): void {
    this.currentFilterValues = {
      zones: [],
      courier: [],
      payment: [],
      shipment: ''
    };
    this.getCodDataPinot();
    this.getStaticsData();
  }
}