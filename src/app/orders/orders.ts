import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpService } from '../services/http-service.service';
import { ToastrService } from '../services/toastr.service';
import { DashboardFiltersComponent, FilterData, FilterValues, DateRange } from '../shared/components/dashboard-filters/dashboard-filters.component';
import * as Highcharts from 'highcharts';

// Simple utility function to get user data
function getUser() {
  const userData = localStorage.getItem('ngStorage-USER');
  return userData ? JSON.parse(userData) : { company_id: null };
}

// Simple date utility
function getDateRange() {
  const today = new Date();
  const thirtyDaysAgo = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));
  return {
    start: thirtyDaysAgo.toISOString().split('T')[0],
    end: today.toISOString().split('T')[0]
  };
}

interface IDateRange {
  start: string;
  end: string;
}

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, DashboardFiltersComponent],
  templateUrl: './orders.html',
  styleUrls: ['./orders.css'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class OrdersComponent implements OnInit {
  title = 'Orders Dashboard';
  
  // Date range properties
  startDate: string;
  endDate: string;
  
  // Data properties
  orders: any[] = [];
  paginationData: any;
  pageSize = 1;
  isOrderData = false;
  locationsData: any[] = [];
  topCustomersData: any[] = [];
  topProductsData: any[] = [];
  
  // Chart properties
  PrepaidvsCOD: any;
  addressQualityChart: Highcharts.Options = {};
  Highcharts: typeof Highcharts = Highcharts;
  
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
    this.initializeCharts();
    this.getFilterData();
    this.getCodDataPinot();
    this.getStaticsData();
    this.getTopCustomers();
    this.getTopProducts();
  }

  private initializeCharts(): void {
    // Initialize Prepaid vs COD chart
    this.PrepaidvsCOD = {
      chart: {
        plotBackgroundColor: '#fff',
        plotBorderWidth: 0,
        plotShadow: false,
        type: 'pie'
      },
      title: {
        text: ''
      },
      tooltip: {
        style: {
          fontSize: '12px'
        },
        pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>'
      },
      exporting: { enabled: false },
      accessibility: {
        point: {
          valueSuffix: '%'
        }
      },
      plotOptions: {
        pie: {
          allowPointSelect: true,
          cursor: 'pointer',
          dataLabels: {
            enabled: true,
            format: '<b>{point.name}</b>: {point.percentage:.1f} %',
            style: {
              fontSize: '12px'
            }
          }
        }
      },
      series: [{
        name: 'Orders',
        type: 'pie',
        data: [{
          name: 'Prepaid',
          y: 70.67,
          sliced: true,
          selected: true
        }]
      }],
      credits: {
        enabled: false
      }
    };

    // Initialize Address Quality chart
    this.addressQualityChart = {
      chart: {
        plotBackgroundColor: '#fff',
        plotBorderWidth: 0,
        plotShadow: false,
      },
      title: {
        text: '',
        align: 'center',
        verticalAlign: 'middle',
        y: 0
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderWidth: 1,
        borderRadius: 5,
        padding: 8,
        shadow: true,
        shared: false,
        useHTML: true,
        style: {
          fontSize: '12px'
        },
        followPointer: true,
        outside: false,
        formatter: function () {
          const point = this as Highcharts.Point;
          let content = '';
      
          if (point.name === 'Valid') {
            content = '<table>' +
              '<tr><td>Valid Addresses</td></tr>' +
              '<tr><td>The given address is a Valid address, which indicates strong confidence of delivery</td></tr>' +
              '</table>';
          } else if (point.name === 'Ambiguous') {
            content = '<table>' +
              '<tr><td>Ambiguous Addresses</td></tr>' +
              '<tr><td>The given address is an Ambiguous, which might be missing some information</td></tr>' +
              '</table>';
          } else {
            content = '<table>' +
              '<tr><td>Junk Addresses</td></tr>' +
              '<tr><td>The given address is a Junk address, which lacks critical information for delivery</td></tr>' +
              '</table>';
          }
      
          return `<div style="font-size: 12px;">${content}</div>`;
        }
      },
      plotOptions: {
        pie: {
          allowPointSelect: true,
          cursor: 'pointer',
          dataLabels: {
            enabled: false,
            distance: -28,
            style: {
              fontWeight: 'bold',
              color: 'white'
            }
          },
          borderWidth: 3,
          center: ['50%', '50%'],
          innerSize: '65%',
          size: 240,
          showInLegend: true
        }
      },
      credits: {
        enabled: false
      },
      series: [{
        type: 'pie' as const,
        name: 'Address Quality',
        data: [2, 5, 3],
        innerSize: '60%'
      }]
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
      let seriesData = [
        {
          name: 'Prepaid',
          y: item.prepaid,
          delivered: item.prepaid_delivered,
          lostdamege: item.prepaid_lost,
          rto: item.prepaid_rto,
          total: item.total_orders,
          prepaid_percentage:
            item.total_orders > 0
              ? ((item.prepaid / item.total_orders) * 100).toFixed(2)
              : null,
          color: 'rgb(163, 161, 251)',
          dataLabels: {
            enabled: true,
            format: '{point.prepaid_percentage:.1f}',
          },
          custom: {
            total: this.convertIndianFormat(item.prepaid),
            delivered: this.convertIndianFormat(item.prepaid_delivered),
            lostdamege: this.convertIndianFormat(item.prepaid_lost),
            rto: this.convertIndianFormat(item.prepaid_rto),
          },
        },
        {
          name: 'COD',
          y: item.cod,
          delivered: item.cod_delivered,
          lostdamege: item.cod_lost,
          rto: item.cod_rto,
          total: item.total_orders,
          cod_percentage:
            item.total_orders > 0
              ? ((item.cod / item.total_orders) * 100).toFixed(2)
              : null,
          color: 'rgb(94, 226, 160)',
          dataLabels: {
            enabled: true,
            format: '{point.cod_percentage:.1f}',
          },
          custom: {
            total: this.convertIndianFormat(item.cod),
            delivered: this.convertIndianFormat(item.cod_delivered),
            lostdamege: this.convertIndianFormat(item.cod_lost),
            rto: this.convertIndianFormat(item.cod_rto),
          },
        },
      ];

      this.PrepaidvsCOD = {
        chart: {
          plotBackgroundColor: '#fff',
          plotBorderWidth: 0,
          plotShadow: false,
        },
        title: {
          text: '',
          align: 'center',
          verticalAlign: 'middle',
          y: 0,
        },
        tooltip: {
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          borderWidth: 1,
          borderRadius: 5,
          padding: 8,
          shadow: true,
          shared: false,
          useHTML: true,
          style: {
            fontSize: '12px'
          },
          followPointer: true,
          outside: false,
          pointFormat:
            '<table><tr><td>Orders:</td><td align="right">{point.custom.total}</td></tr><tr><td>Delivered:</td><td align="right">{point.custom.delivered}</td></tr><tr><td>RTO:</td><td align="right">{point.custom.rto}</td></tr><tr><td>Lost & Damaged:</td><td align="right">{point.custom.lostdamege}</td></tr></table>'
        },
        credits: {
          enabled: false,
        },
        legend: {
          itemStyle: {
            color: 'rgb(51, 51, 51)',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 'bold',
            fill: 'rgb(51, 51, 51)',
          },
        },
        plotOptions: {
          pie: {
            allowPointSelect: true,
            cursor: 'pointer',
            dataLabels: {
              enabled: false,
              distance: -28,
              style: {
                fontWeight: 'bold',
                color: 'white',
                fontSize: '12px'
              },
            },
            borderWidth: 3,
            center: ['50%', '50%'],
            innerSize: '65%',
            size: 240,
            showInLegend: true,
          },
        },
        series: [
          {
            name: 'Orders',
            data: seriesData,
            type: 'pie',
            innerSize: '60%',
          },
        ],
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

    const chartData = [
      {
        name: 'Valid',
        y: parseFloat(data.valid_address),
        color: '#50B432',
        percentage: parseFloat(data.valid_address),
        custom: {
          total: this.convertIndianFormat(data.valid_address),
          percent: data.valid_address,
        },
        dataLabels: {
          enabled: true,
          format: '{point.percentage:.1f}%',
          distance: -28,
          style: {
            fontWeight: 'bold',
            color: 'white'
          }
        }
      },
      {
        name: 'Ambiguous',
        y: parseFloat(data.ambiguous_address),
        color: '#DDDF00',
        percentage: parseFloat(data.ambiguous_address),
        custom: {
          total: this.convertIndianFormat(data.ambiguous_address),
          percent: data.ambiguous_address,
        },
        dataLabels: {
          enabled: true,
          format: '{point.percentage:.1f}%',
          distance: -28,
          style: {
            fontWeight: 'bold',
            color: 'white'
          }
        }
      },
      {
        name: 'Junk',
        y: parseFloat(data.junk_address),
        color: '#ED561B',
        percentage: parseFloat(data.junk_address),
        custom: {
          total: this.convertIndianFormat(data.junk_address),
          percent: data.junk_address,
        },
        dataLabels: {
          enabled: true,
          format: '{point.percentage:.1f}%',
          distance: -28,
          style: {
            fontWeight: 'bold',
            color: 'white'
          }
        }
      }
    ];

    this.addressQualityChart = {
      chart: {
        plotBackgroundColor: '#fff',
        plotBorderWidth: 0,
        plotShadow: false,
      },
      title: {
        text: '',
        align: 'center',
        verticalAlign: 'middle',
        y: 0
      },
      exporting: { enabled: false },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderWidth: 1,
        borderRadius: 5,
        padding: 8,
        shadow: true,
        shared: false,
        useHTML: true,
        style: {
          fontSize: '12px'
        },
        followPointer: true,
        outside: false,
        formatter: function () {
          const point = this as Highcharts.Point;
          let content = '';

          if (point.name === 'Valid') {
            content = '<table>' +
              '<tr><td>Valid Addresses</td></tr>' +
              '<tr><td>The given address is a Valid address, which indicates strong confidence of delivery</td></tr>' +
              '</table>';
          } else if (point.name === 'Ambiguous') {
            content = '<table>' +
              '<tr><td>Ambiguous Addresses</td></tr>' +
              '<tr><td>The given address is an Ambiguous, which might be missing some information</td></tr>' +
              '</table>';
          } else {
            content = '<table>' +
              '<tr><td>Junk Addresses</td></tr>' +
              '<tr><td>The given address is a Junk address, which lacks critical information for delivery</td></tr>' +
              '</table>';
          }

          return `<div style="font-size: 12px;">${content}</div>`;
        }
      },
      legend: {
        itemStyle: {
          fontSize: '12px',
          fontWeight: 'bold',
          color: 'rgb(51, 51, 51)',
          fill: 'rgb(51, 51, 51)',
          cursor: 'pointer',
        },
      },
      plotOptions: {
        pie: {
          allowPointSelect: true,
          cursor: 'pointer',
          dataLabels: {
            enabled: false,
            distance: -28,
            style: {
              fontWeight: 'bold',
              color: 'white',
              fontSize: '12px'
            }
          },
          borderWidth: 3,
          center: ['50%', '50%'],
          innerSize: '65%',
          size: 240,
          showInLegend: true
        }
      },
      credits: {
        enabled: false
      },
      series: [{
        type: 'pie' as const,
        name: 'Address Quality',
        data: chartData,
        innerSize: '60%'
      }]
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