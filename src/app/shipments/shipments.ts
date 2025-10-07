import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpService } from '../services/http-service.service';
import { DashboardFiltersComponent, FilterData, FilterValues, DateRange } from '../shared/components/dashboard-filters/dashboard-filters.component';
import { BaseChartDirective } from 'ng2-charts';
import { Chart, ChartConfiguration, ChartData, ArcElement, Tooltip, Legend, DoughnutController, PieController, BarElement, CategoryScale, LinearScale, BarController } from 'chart.js';
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
  selector: 'app-shipments',
  standalone: true,
  imports: [CommonModule, FormsModule, DashboardFiltersComponent, BaseChartDirective],
  templateUrl: './shipments.html',
  styleUrls: ['./shipments.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class ShipmentsComponent implements OnInit {
  title = 'Shipments Dashboard';
  
  // Date range properties
  startDate: any = moment().subtract(30, 'days').format('YYYY-MMM-DD');
  endDate: any = moment().subtract(1, 'days').format('YYYY-MMM-DD');
  startDateIndian: string;
  endDateIndian: string;
  previousStartDate: string;
  previousEndDate: string;
  
  // Data properties
  shipmentoverview: any;
  shipmentoverviewPrevious: any;
  shipmentCourierZoneCount: any;
  getshipmentchannellist: any;
  weightProfileData: any;
  shipmentZoneData: any;
  
  // Chart.js properties
  public doughnutType: 'doughnut' = 'doughnut' as const;
  public barType: 'bar' = 'bar' as const;
  
  public courierZoneCountChartData: ChartData<'bar'> = { labels: [], datasets: [] };
  public courierZoneCountChartOptions: ChartConfiguration<'bar'>['options'] = {};
  
  public weightProfileChartData: ChartData<'doughnut'> = { labels: [], datasets: [] };
  public weightProfileChartOptions: ChartConfiguration<'doughnut'>['options'] = {};
  
  public shipmentZoneChartData: ChartData<'doughnut'> = { labels: [], datasets: [] };
  public shipmentZoneChartOptions: ChartConfiguration<'doughnut'>['options'] = {};
  
  // Filter properties
  filterData: FilterData = {};
  currentFilterValues: FilterValues = {
    zones: [],
    courier: [],
    payment: [],
    shipment: ''
  };
  
  // Toggle properties
  shipmentDisplayMode = true;

  constructor(
    private http: HttpService,
    
    private cdr: ChangeDetectorRef
  ) {
    // Initialize date range
    const dateRange = getDateRange();
    this.startDate = dateRange.start;
    this.endDate = dateRange.end;
    
    // Calculate previous date range
    this.previousStartDate = this.calculatePreviousStartDate();
    this.previousEndDate = this.calculatePreviousEndDate();
    
    // Format dates for display
    this.startDateIndian = this.formatDateForDisplay(this.startDate);
    this.endDateIndian = this.formatDateForDisplay(this.endDate);
  }

  ngOnInit(): void {
    Chart.register(ArcElement, Tooltip, Legend, DoughnutController, PieController, BarElement, CategoryScale, LinearScale, BarController);
    this.getFilterData();
    this.getStaticsData();
    this.getshipmentchannel();
    this.getWeightProfile();
    this.shipmentZoneProfile();
    this.getshipmentcount();
  }

  private calculatePreviousStartDate(): string {
    const start = moment(this.startDate, 'YYYY-MMM-DD');
    const end = moment(this.endDate, 'YYYY-MMM-DD');
    const diffDays = end.diff(start, 'days') + 1;
    const previousStart = start.clone().subtract(diffDays, 'days');
    return previousStart.format('YYYY-MMM-DD');
  }

  private calculatePreviousEndDate(): string {
    const start = moment(this.startDate, 'YYYY-MMM-DD');
    const previousEnd = start.clone().subtract(1, 'days');
    return previousEnd.format('YYYY-MMM-DD');
  }

  private formatDateForDisplay(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  onDateRangeChange(range: DateRange): void {
    this.startDate = range.start;
    this.endDate = range.end;
    this.startDateIndian = this.formatDateForDisplay(this.startDate);
    this.endDateIndian = this.formatDateForDisplay(this.endDate);
    this.previousStartDate = this.calculatePreviousStartDate();
    this.previousEndDate = this.calculatePreviousEndDate();
    this.callAllFunctions();
  }

  onFilterChange(filterValues: FilterValues): void {
    this.currentFilterValues = filterValues;
    this.callAllFunctions();
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

  getStaticsData(): void {
    const data: any = {
      date_from: this.startDate,
      date_to: this.endDate,
      courier_mode: this.currentFilterValues.shipment ? this.currentFilterValues.shipment : '',
      courier_name: this.currentFilterValues.courier ? this.currentFilterValues.courier : '',
      payment_method: this.currentFilterValues.payment ? this.currentFilterValues.payment : '',
      zone: this.currentFilterValues.zones ? this.currentFilterValues.zones : '',
    };

    this.http.srDashboardGet('2.0/getcourierzonecount', data).subscribe(
      (res) => {
        console.log('Zone Wise Shipments Response:', res);
        this.shipmentCourierZoneCount = res.data;
        console.log('shipmentCourierZoneCount:', this.shipmentCourierZoneCount);
        
        if (this.shipmentCourierZoneCount?.length) {
          setTimeout(() => {
          this.courierZoneCountGraph(this.shipmentCourierZoneCount);
            this.cdr.markForCheck();
          }, 100);
        }
        this.cdr.markForCheck();
      },
      (err) => {
        console.error('Zone count error:', err);
        this.cdr.markForCheck();
      }
    );
  }

  courierZoneCountGraph(graphData: any): void {
    console.log('courierZoneCountGraph called with data:', graphData);
    // Simplified bar chart for Chart.js - showing total counts by courier
    const categories: string[] = [];
    const deliveredData: number[] = [];
    const rtoData: number[] = [];
    const lostData: number[] = [];

    graphData.forEach((item: any) => {
      categories.push(item.courier_name);
      let totalDelivered = 0;
      let totalRTO = 0;
      let totalLost = 0;

      Object.keys(item.zones).forEach((key) => {
        totalDelivered += item.zones[key].delivered_count || 0;
        totalRTO += item.zones[key].RTO_count || 0;
        totalLost += item.zones[key].canceled_count || 0;
      });

      deliveredData.push(totalDelivered);
      rtoData.push(totalRTO);
      lostData.push(totalLost);
    });
    
    console.log('Chart data prepared:', { categories, deliveredData, rtoData, lostData });

    this.courierZoneCountChartData = {
      labels: categories,
      datasets: [
        {
          label: 'Delivered',
          data: deliveredData,
          backgroundColor: '#5ee2a0',
          borderWidth: 0
        },
        {
          label: 'RTO',
          data: rtoData,
          backgroundColor: '#a3a1fb',
          borderWidth: 0
        },
        {
          label: 'Lost/Damage',
          data: lostData,
          backgroundColor: '#ffe17a',
          borderWidth: 0
        }
      ]
    };
    this.courierZoneCountChartOptions = {
      responsive: true,
      plugins: {
        legend: { display: true, position: 'top', labels: { boxWidth: 12, font: { size: 12 } } },
        tooltip: { enabled: true }
      },
      scales: {
        x: { stacked: true },
        y: { stacked: true, beginAtZero: true, title: { display: true, text: 'Number of Shipments' } }
      }
    };
  }

  getshipmentchannel(): void {
    const data: any = {
      date_from: this.startDate,
      date_to: this.endDate,
      courier_mode: this.currentFilterValues.shipment ? this.currentFilterValues.shipment : '',
      courier_name: this.currentFilterValues.courier ? this.currentFilterValues.courier : '',
      payment_method: this.currentFilterValues.payment ? this.currentFilterValues.payment : '',
      zone: this.currentFilterValues.zones ? this.currentFilterValues.zones : '',
    };

    this.http.srDashboardGet('2.0/getshipmentchannel', data).subscribe(
      (res) => {
        this.getshipmentchannellist = res.data;
        this.cdr.markForCheck();
      },
      (err) => {
        console.error(err.error?.message || 'Error fetching shipment channel data');
        this.cdr.markForCheck();
      }
    );
  }

  getWeightProfile(): void {
    const data: any = {
      date_from: this.startDate,
      date_to: this.endDate,
      courier_mode: this.currentFilterValues.shipment ? this.currentFilterValues.shipment : '',
      courier_name: this.currentFilterValues.courier ? this.currentFilterValues.courier : '',
      payment_method: this.currentFilterValues.payment ? this.currentFilterValues.payment : '',
      zone: this.currentFilterValues.zones ? this.currentFilterValues.zones : '',
    };

    this.http.srDashboardGet('2.0/getshipmentweight', data).subscribe(
      (res) => {
        console.log('Weight Profile Response:', res);
        this.weightProfileData = res.data;
        console.log('weightProfileData:', this.weightProfileData);
        
        if (Array.isArray(this.weightProfileData) && this.weightProfileData?.length == 0) {
          console.log('Weight profile data is empty array');
        } else {
          console.log('Creating weight profile chart...');
          setTimeout(() => {
          this.creategGetWeightProfile(res.data);
            this.cdr.markForCheck();
          }, 100);
        }
        this.cdr.markForCheck();
      },
      (err) => {
        console.error('Weight profile error:', err);
        this.cdr.markForCheck();
      }
    );
  }

  creategGetWeightProfile(item: any): void {
    console.log('creategGetWeightProfile called with data:', item);
    const labels = ['0.5 Kgs', '0.5-1 Kgs', '1-1.5 Kgs', '1.5-2 Kgs', '2-5 Kgs', '5+ Kgs'];
    const data = [
      item['0.5'] || 0,
      item['0.5-1'] || 0,
      item['1-1.5'] || 0,
      item['1.5-2'] || 0,
      item['2-5'] || 0,
      item['5+'] || 0
    ];
    console.log('Weight profile chart data:', { labels, data });
    const colors = [
      'rgb(163, 161, 251)',
      'rgb(96, 235, 160)',
      'rgb(40, 95, 219)',
      'rgb(252, 160, 118)',
      'rgb(244, 122, 194)',
      'rgb(253, 236, 111)'
    ];

    this.weightProfileChartData = {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: colors,
        borderWidth: 0
      }]
    };
    this.weightProfileChartOptions = {
      responsive: true,
      cutout: '65%',
      plugins: {
        legend: { display: true, position: 'bottom', labels: { boxWidth: 12, font: { size: 12 } } },
        tooltip: { enabled: true }
      }
    };
  }

  shipmentZoneProfile(): void {
    const data: any = {
      date_from: this.startDate,
      date_to: this.endDate,
      courier_mode: this.currentFilterValues.shipment ? this.currentFilterValues.shipment : '',
      courier_name: this.currentFilterValues.courier ? this.currentFilterValues.courier : '',
      payment_method: this.currentFilterValues.payment ? this.currentFilterValues.payment : '',
      zone: this.currentFilterValues.zones ? this.currentFilterValues.zones : '',
    };

    this.http.srDashboardGet('2.0/getshipmentzone', data).subscribe(
      (res) => {
        console.log('Shipment Zone Response:', res);
        this.shipmentZoneData = res.data;
        console.log('shipmentZoneData:', this.shipmentZoneData);
        
        if (this.shipmentZoneData?.length) {
          setTimeout(() => {
          this.createShipmentZoneProfile(res.data);
            this.cdr.markForCheck();
          }, 100);
        }
        this.cdr.markForCheck();
      },
      (err) => {
        console.error('Shipment zone error:', err);
        this.cdr.markForCheck();
      }
    );
  }

  createShipmentZoneProfile(items: any): void {
    console.log('createShipmentZoneProfile called with data:', items);
    const zomeMap: any = {
      z_a: { name: 'Zone A', color: 'rgb(163, 161, 251)' },
      z_b: { name: 'Zone B', color: 'rgb(96, 235, 160)' },
      z_c: { name: 'Zone C', color: 'rgb(40, 95, 219)' },
      z_d: { name: 'Zone D', color: 'rgb(252, 160, 118)' },
      z_e: { name: 'Zone E', color: 'rgb(244, 122, 194)' },
    };

    const labels: string[] = [];
    const data: number[] = [];
    const colors: string[] = [];

    for (const item of items) {
      labels.push(zomeMap[item.zone].name);
      data.push(item.count);
      colors.push(zomeMap[item.zone].color);
    }
    
    console.log('Shipment zone chart data:', { labels, data, colors });

    this.shipmentZoneChartData = {
      labels: labels,
      datasets: [{
          data: data,
        backgroundColor: colors,
        borderWidth: 0
      }]
    };
    this.shipmentZoneChartOptions = {
      responsive: true,
      cutout: '65%',
      plugins: {
        legend: { display: true, position: 'bottom', labels: { boxWidth: 12, font: { size: 12 } } },
        tooltip: { enabled: true }
      }
    };
  }

  getshipmentcount(): void {
    const url = '2.0/getshipmentcount';
    const data: any = {
      date_from: this.startDate,
      date_to: this.endDate,
      courier_mode: this.currentFilterValues.shipment ? this.currentFilterValues.shipment : '',
      courier_name: this.currentFilterValues.courier ? this.currentFilterValues.courier : '',
      payment_method: this.currentFilterValues.payment ? this.currentFilterValues.payment : '',
      zone: this.currentFilterValues.zones ? this.currentFilterValues.zones : '',
    };

    this.http.srDashboardGet(url, data).subscribe(
      (resCurrent) => {
        if (Array.isArray(resCurrent?.data) && resCurrent?.data?.length == 0) {
          this.shipmentoverview = false;
          this.getPreviousShipment('', url);
        } else {
          this.shipmentoverview = resCurrent.data;
          const courierArray = [];
          for (const courierID in this.shipmentoverview) {
            if (this.shipmentoverview[courierID]?.id) {
              courierArray.push(this.shipmentoverview[courierID]?.id);
            }
          }
          this.getPreviousShipment(courierArray.toString(), url);
        }
        this.cdr.markForCheck();
      },
      (err) => {
        console.error(err?.error?.message || 'Error fetching shipment count data');
        this.cdr.markForCheck();
      }
    );
  }

  getPreviousShipment(couriers: any, url: string): void {
    const data: any = {
      date_from: this.startDate,
      date_to: this.endDate,
      from: this.previousStartDate,
      to: this.previousEndDate,
      zone: this.currentFilterValues.zones ? this.currentFilterValues.zones : '',
      with_courier: couriers,
    };

    this.http.srDashboardGet(url, data).subscribe(
      (res) => {
        this.shipmentoverviewPrevious = res.data;
        this.cdr.markForCheck();
      },
      (err) => {
        console.error(err?.error?.message || 'Error fetching previous shipment data');
        this.cdr.markForCheck();
      }
    );
  }

  // Utility methods
  convertIndianFormat(amt: any): string {
    const amount = parseInt(amt);
    if (!isNaN(amount)) {
      let result = amount.toString().split('.');
      let lastThree = result[0].substring(result[0].length - 3);
      let otherNumbers = result[0].substring(0, result[0].length - 3);
      if (otherNumbers != '') lastThree = ',' + lastThree;
      let output = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;

      if (result.length > 1) {
        output += '.' + result[1];
      }
      return output;
    } else {
      return '0';
    }
  }

  convertToPositive(number: any): string {
    return Math.abs(number).toFixed(1);
  }

  getPercentage(value: any, total: any, decimals: number = 1): string {
    if (!total || total === 0) {
      return '-';
    }
    if (!value || value === 0) {
      return '0%';
    }
    const percentage = (value / total) * 100;
    return percentage.toFixed(decimals) + '%';
  }

  calculateClass(currentTotal: number, previousTotal: number): boolean {
    if (!currentTotal && !previousTotal) {
      return false;
    }

    if (!currentTotal) {
      return true;
    }

    if (!previousTotal) {
      return true;
    }

    const percentageChange = ((currentTotal - previousTotal) / previousTotal) * 100;
    return percentageChange >= 0 ? true : false;
  }

  shouldShowElement(list: any, previous: any, key: number): any {
    if (!list?.total || !previous?.[key]?.total) {
      return null;
    }

    const currentPercentage = (list?.delivered_count / list?.total) * 100;
    const previousPercentage = (previous?.[key]?.delivered_count / previous?.[key]?.total) * 100;
    return (currentPercentage - previousPercentage).toFixed(2);
  }

  calculateClass2(list: any, previous: any, key: number): boolean {
    if (!list?.total || !previous?.[key]?.total) {
      return false;
    }

    const currentPercentage = (list?.delivered_count / list?.total) * 100;
    const previousPercentage = (previous?.[key]?.delivered_count / previous?.[key]?.total) * 100;
    return (currentPercentage - previousPercentage) >= 0;
  }

  isweightProfileDataNotEmpty(): boolean {
    if (this.weightProfileData && Object.keys(this.weightProfileData)?.length > 0) {
      for (const key in this.weightProfileData) {
        if (this.weightProfileData[key] > 0) {
          return true;
        }
      }
      return false;
    } else {
      return false;
    }
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

  private callAllFunctions(): void {
    this.getStaticsData();
    this.getshipmentchannel();
    this.getWeightProfile();
    this.shipmentZoneProfile();
    this.getshipmentcount();
  }

  // trackBy helpers for template performance
  trackByShipmentOverview = (_: number, item: any) => item?.id ?? item?.name ?? _;
  trackByChannel = (_: number, item: any) => item?.channel_name ?? _;
}