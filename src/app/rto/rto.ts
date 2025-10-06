import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpService } from '../services/http-service.service';
import { ToastrService } from '../services/toastr.service';
import { DashboardFiltersComponent } from '../shared/components/dashboard-filters/dashboard-filters.component';
import { DateRange, FilterData, FilterValues } from '../shared/components/dashboard-filters/dashboard-filters.component';
import moment from 'moment';
import * as Highcharts from 'highcharts';

@Component({
  selector: 'app-rto',
  standalone: true,
  imports: [CommonModule, FormsModule, DashboardFiltersComponent],
  templateUrl: './rto.html',
  styleUrl: './rto.css',
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class RtoComponent implements OnInit {
  startDate: any = moment().subtract(30, 'days').format('YYYY-MMM-DD');
  endDate: any = moment().subtract(1, 'days').format('YYYY-MMM-DD');
  rto_stats: any;
  Highcharts: typeof Highcharts = Highcharts;
  rto_count_line_chart: Highcharts.Options = {};
  rto_tab_raw_data: any;
  rto_tab_raw_hide_no_data: any;
  rto_tab_status_chart: Highcharts.Options = {};
  rto_tab_reasons: any;
  noDataPieChart = false;
  rto_reason_pie_chart: Highcharts.Options = {};
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
    this.rto_tab_status_chart = {
      chart: {
        type: 'column',
      },
      title: {
        text: '',
      },
      colors: ['#a3a1fb', '#5ee2a0', '#ff8484'],
      xAxis: {
        categories: ['rto initiated', 'rto delivered', 'rto undelivered'],
        crosshair: true,
        labels: {
          y: 40,
        },
      },
      credits: {
        enabled: false,
      },
      exporting: { enabled: false },
      yAxis: {
        gridLineWidth: 0,
        allowDecimals: false,
        min: 0,
        title: {
          text: '',
        },
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
        headerFormat: '<span style="font-size:10px">{point.key}</span><table>',
        pointFormat:
          '<tr><td style="color:{series.color};padding:0;font-weight:bold">{series.name}: </td>' +
          '<td style="padding:0;text-align:right" align="right"><b>{point.custom.total: .0f}</b></td></tr>',
        footerFormat:
          '<tr><td><span style="font-size:10px">Total RTO :</span></td><td> <b>{point.total}</b></td></tr></table>',
      },
      plotOptions: {
        series: {
          events: {
            legendItemClick: function (e) {
              e.preventDefault();
            },
          },
        },
      },
      series: [
        {
          name: 'RTO Initiated',
          data: [1,4,6],
          type: 'column',
        },
        {
          name: 'RTO Delivered',
          data: [3,6,2],
          type: 'column',
        },
        {
          name: 'RTO Undelivered',
          data: [0,7,4],
          type: 'column',
        },
      ],
    };

    this.rto_reason_pie_chart = {
      series: [{
        name: 'Browsers',
        type: 'pie',
        data: []
      }],
      credits: {
        enabled: false
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderWidth: 1,
        borderRadius: 5,
        padding: 8,
        shadow: true,
        useHTML: true,
        style: {
          fontSize: '12px'
        },
        followPointer: true,
        outside: false,
        pointFormat:
          '<table><tr><td>RTO Count : </td><td><b> {point.custom.total} ({point.order_count_percentage})</b> </td></tr></table>',
      },
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
      rto_count.push({
        y: this.rto_tab_raw_data[key].rto,
        rto: this.convertIndianFormat(this.rto_tab_raw_data[key].rto),
        total_shipments: this.convertIndianFormat(
          parseInt(this.rto_tab_raw_data[key].total_shipments)
        ),
        rto_percentage: this.rto_tab_raw_data[key].rto_percentage,
      });
    }

    this.rto_count_line_chart = {
      colors: ['#a078ce'],
      title: {
        text: '',
      },
      subtitle: {
        text: '',
      },
      credits: {
        enabled: false,
      },
      exporting: { enabled: false },
      xAxis: {
        categories: rto_date,
        labels: {
          style: {
            fontSize: '12px',
          },
        },
        lineWidth: 1,
        lineColor: '#ccd6eb',
      },
      yAxis: {
        gridLineWidth: 0,
        allowDecimals: false,
        title: {
          text: '',
          style: {
            fontSize: '12px'
          }
        },
        labels: {
          style: {
            fontSize: '12px'
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderWidth: 1,
        borderRadius: 5,
        padding: 8,
        shadow: true,
        shared: true,
        useHTML: true,
        style: {
          fontSize: '12px'
        },
        headerFormat: '<span style="font-size:10px">{point.key}</span>',
        pointFormat: `<table>
        <tr><td>Total Shipments :</td><td align="right"><b> {point.total_shipments}</b></td></tr>
        <tr><td style="padding:0">RTO Count :</td><td align="right"><b> {point.rto}</b></td></tr>
        <tr><td>RTO Percentage :</td><td align="right"><b> {point.rto_percentage}</b></td></tr>`
      },
      legend: {
        itemStyle: {
          fontSize: '12px', 
          fontWeight: '700',
          color: 'rgb(51, 51, 51)',
          fill: 'rgb(51, 51, 51)',
          cursor: 'pointer',
        },
      },
      plotOptions: {
        spline: {
          marker: {
            radius: 4,
            lineColor: '#666666',
            lineWidth: 1,
            symbol: 'circle',
          },
        },
      },
      series: [
        {
          name: 'RTO Count',
          data: rto_count,
          type: 'line',
        },
      ],
    };
  }

  rtoTabRtoStatusChart(): void {
    const rto_date = [];
    const rto_initiated = [];
    const rto_delivered = [];
    const rto_undelivered = [];

    for (const key in this.rto_tab_raw_data) {
      rto_date.push(key);
      rto_initiated.push({
        y: parseInt(this.rto_tab_raw_data?.[key]?.rto_initiated),
        total: this.convertIndianFormat(this.rto_tab_raw_data?.[key]?.rto),
        custom: {
          total: this.convertIndianFormat(
            this.rto_tab_raw_data?.[key]?.rto_initiated
          ),
        },
      });
      rto_delivered.push({
        y: parseInt(this.rto_tab_raw_data?.[key]?.rto_delivered),
        total: this.convertIndianFormat(this.rto_tab_raw_data?.[key]?.rto),
        custom: {
          total: this.convertIndianFormat(
            this.rto_tab_raw_data?.[key]?.rto_delivered
          ),
        },
      });
      rto_undelivered.push({
        y: parseInt(this.rto_tab_raw_data?.[key]?.rto_undelivered),
        total: this.convertIndianFormat(this.rto_tab_raw_data?.[key]?.rto),
        custom: {
          total: this.convertIndianFormat(
            this.rto_tab_raw_data?.[key]?.rto_undelivered
          ),
        },
      });
    }
   
    this.rto_tab_status_chart = {
      chart: {
        type: 'column',
      },
      title: {
        text: '',
      },
      colors: ['#a3a1fb', '#5ee2a0', '#ff8484'],
      xAxis: {
        categories: rto_date,
        crosshair: true,
        labels: {
          y: 40,
          style: {
            fontSize: '12px'
          }
        },
        lineWidth: 1,
        lineColor: '#ccd6eb',
      },
      credits: {
        enabled: false,
      },
      exporting: { enabled: false },
      yAxis: {
        gridLineWidth: 0,
        allowDecimals: false,
        min: 0,
        title: {
          text: '',
        },
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderWidth: 1,
        borderRadius: 5,
        padding: 8,
        shadow: true,
        shared: true,
        useHTML: true,
        style: {
          fontSize: '12px'
        },
        headerFormat: '<span style="font-size:10px">{point.key}</span><table>',
        pointFormat:
          '<tr><td style="color:{series.color};padding:0;font-weight:bold">{series.name}: </td>' +
          '<td style="padding:0;text-align:right" align="right"><b>{point.custom.total: .0f}</b></td></tr>',
        footerFormat:
          '<tr><td><span style="font-size:10px">Total RTO :</span></td><td> <b>{point.total}</b></td></tr></table>',
      },
      legend: {
        itemStyle: {
          fontSize: '12px', 
          fontWeight: '700',
          color: 'rgb(51, 51, 51)',
          fill: 'rgb(51, 51, 51)',
          cursor: 'pointer',
        },
      },
      plotOptions: {
        series: {
          events: {
            legendItemClick: function (e) {
              e.preventDefault();
            },
          },
        },
      },
      series: [
        {
          name: 'RTO Initiated',
          data: rto_initiated,
          type: 'column',
        },
        {
          name: 'RTO Delivered',
          data: rto_delivered,
          type: 'column',
        },
        {
          name: 'RTO Undelivered',
          data: rto_undelivered,
          type: 'column',
        },
      ],
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
      const chartData = [];
      const clr = [
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
      let toatalRto = 0;
      for (let i = 0; i < length; i++) {
        const formatedData = {
          name: item[keys[i]].reason_name,
          y: item[keys[i]].rto,
          order_count_percentage: item[keys[i]].percentage,
          color: clr[i],
          dataLabels: {
            enabled: false,
            format: '{point.order_count_percentage}',
            padding: 0,
          },
          custom: { total: this.convertIndianFormat(item[keys[i]].rto) },
        };
        chartData.push(formatedData);
        this.noDataPieChart = false;
        toatalRto = toatalRto + item[keys[i]].rto;
      }
      for (let i = 0; i < length; i++) {
        chartData[i].y = (chartData[i].y / toatalRto) * 100;
        if (chartData[i].y < 1) {
          chartData[i].y = 1;
        }
      }

      this.rto_reason_pie_chart = {
        chart: {
          renderTo: 'rto_reason_pie_chart',
          type: 'pie',
        },
        title: {
          text: '',
        },
        tooltip: {
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          borderWidth: 1,
          borderRadius: 5,
          padding: 8,
          shadow: true,
          useHTML: true,
          style: {
            fontSize: '12px'
          },
          followPointer: true,
          outside: false,
          pointFormat:
            '<table><tr><td>RTO Count : </td><td><b> {point.custom.total} ({point.order_count_percentage})</b> </td></tr></table>',
        },
        credits: {
          enabled: false,
        },
        exporting: { enabled: false },
        plotOptions: {
          pie: {
            dataLabels: {
              distance: -28,
              style: {
                color: '#fff',
              },
              enabled: true,
            },
            borderWidth: 3,
            showInLegend: false,
            innerSize: '65%',
            size: 240,
            center: ['50%', '50%'],
          },
          series: {
            point: {
              events: {
                legendItemClick: function () {
                  return false;
                },
              },
            },
          },
        },
        series: [
          {
            data: chartData,
            type: 'pie',
          },
        ],
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
