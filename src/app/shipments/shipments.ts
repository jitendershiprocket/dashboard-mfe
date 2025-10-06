import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpService } from '../services/http-service.service';
import { ToastrService } from '../services/toastr.service';
import { DashboardFiltersComponent, FilterData, FilterValues, DateRange } from '../shared/components/dashboard-filters/dashboard-filters.component';
import * as Highcharts from 'highcharts';
import moment from 'moment';

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
  selector: 'app-shipments',
  standalone: true,
  imports: [CommonModule, FormsModule, DashboardFiltersComponent],
  templateUrl: './shipments.html',
  styleUrls: ['./shipments.css'],
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
  
  // Chart properties
  courierZoneCountGraphs: Highcharts.Options = {};
  weightProfileGraph: Highcharts.Options = {};
  shipmentZoneGraph: Highcharts.Options = {};
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
  shipmentDisplayMode = true;

  constructor(
    private http: HttpService,
    private toastr: ToastrService
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
    this.getFilterData();
    this.getStaticsData();
    this.getshipmentchannel();
    this.getWeightProfile();
    this.shipmentZoneProfile();
    this.getshipmentcount();
  }

  private calculatePreviousStartDate(): string {
    const start = new Date(this.startDate);
    const end = new Date(this.endDate);
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    const previousStart = new Date(start.getTime() - (diffDays * 24 * 60 * 60 * 1000));
    return previousStart.toISOString().split('T')[0];
  }

  private calculatePreviousEndDate(): string {
    const start = new Date(this.startDate);
    const previousEnd = new Date(start.getTime() - (24 * 60 * 60 * 1000));
    return previousEnd.toISOString().split('T')[0];
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
        this.shipmentCourierZoneCount = res.data;
        if (this.shipmentCourierZoneCount?.length) {
          this.courierZoneCountGraph(this.shipmentCourierZoneCount);
        }
      },
      (err) => {
        this.toastr.error(err.error?.message || 'Error fetching courier zone count data');
      }
    );
  }

  courierZoneCountGraph(graphData: any): void {
    const series: any = [];
    const categories: any = [];
    const zones: any = [];

    const totalCount: any = [];
    graphData.forEach((item: any, rootIndex: any) => {
      Object.keys(item.zones).forEach((key, index) => {
        const getZonekey = key.split('_');
        if (series?.length == 0) {
          zones.push(getZonekey[1].toUpperCase());
        }

        const deliveredData: any = {
          name: 'Delivered',
          data: [item.zones[key].delivered_count],
          stack: getZonekey[1].toUpperCase(),
          color: '#5ee2a0',
        };
        const rtoData: any = {
          name: 'RTO',
          data: [item.zones[key].RTO_count],
          stack: getZonekey[1].toUpperCase(),
          color: '#a3a1fb',
        };
        const lostData: any = {
          name: 'Lost/Damage',
          data: [item.zones[key].canceled_count],
          stack: getZonekey[1].toUpperCase(),
          color: '#ffe17a',
        };

        totalCount.push(
          item.zones[key].delivered_count +
            item.zones[key].RTO_count +
            item.zones[key].canceled_count
        );

        if (rootIndex == 0) {
          if (index == 0) {
            deliveredData.id = 'delivered';
            rtoData.id = 'rto';
            lostData.id = 'lost-damage';
          } else {
            deliveredData.linkedTo = 'delivered';
            rtoData.linkedTo = 'rto';
            lostData.linkedTo = 'lost-damage';
          }

          series.push(deliveredData);
          series.push(rtoData);
          series.push(lostData);
        } else {
          if (index == 0) {
            series[index].data.push(item.zones[key].delivered_count);
            series[index + 1].data.push(item.zones[key].RTO_count);
            series[index + 2].data.push(item.zones[key].canceled_count);
          } else {
            series[index * 3].data.push(item.zones[key].delivered_count);
            series[index * 3 + 1].data.push(item.zones[key].RTO_count);
            series[index * 3 + 2].data.push(item.zones[key].canceled_count);
          }
        }
      });
      categories.push(item.courier_name);
    });

    this.courierZoneCountGraphs = {
      chart: {
        type: 'column',
      },
      title: {
        text: '',
      },
      xAxis: {
        categories: categories,
        labels: {
          y: 40,
          style: {
            fontSize: '12px'
          }
        },
        lineColor: '#ccd6eb',
        lineWidth: 1,
      },
      yAxis: {
        gridLineWidth: 0,
        reversedStacks: false,
        allowDecimals: false,
        min: 0,
        title: {
          text: 'Number of Shipments',
          style: {
            fontSize: '12px'
          }
        },
        labels: {
          style: {
            fontSize: '12px'
          }
        },
        stackLabels: {
          enabled: true,
          verticalAlign: 'bottom',
          crop: false,
          y: 20,
          style: {
            fontSize: '12px',
          },
        },
      },
      credits: {
        enabled: false,
      },
      exporting: { enabled: false },
      legend: {
        itemStyle: {
          fontSize: '12px', 
          fontWeight: 'bold',
          color: 'rgb(51, 51, 51)',
          fill: 'rgb(51, 51, 51)',
          cursor: 'pointer',
        },
        align: 'right',
        verticalAlign: 'top',
        labelFormatter: function () {
          return this.name;
        },
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderWidth: 1,
        borderRadius: 5,
        padding: 10,
        shadow: true,
        shared: false,
        style: {
          fontSize: '12px'
        },
        followPointer: true,
        outside: false,
        useHTML: true,
        formatter: function () {
          const stackName = this.series.userOptions.stack;
          const points: any = this as Highcharts.Point;
          const seriess: any = this.series;
          const totalShipmentCount: any =
            totalCount[5 * points.index + seriess.columnIndex];
          return (
            '<table><tr><td colspan="2">Zone ' +
            stackName +
            '</td></tr><tr><td colspan="2">' +
            this.x +
            '</tr><tr><td>' +
            this.series.name +
            ' :&nbsp;</td><td style="text-align:right"> <b>' +
            points.y +
            ' (' +
            parseInt(((points.y / totalShipmentCount) * 100).toString()) +
            '%)</b></td></tr><table>'
          );
        },
      },
      plotOptions: {
        column: {
          stacking: 'normal',
          pointWidth: 20,
        },
        series: {
          states: {
            inactive: {
              enabled: false,
            },
          },
        },
      },
      series: series,
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
      },
      (err) => {
        this.toastr.error(err.error?.message || 'Error fetching shipment channel data');
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
        this.weightProfileData = res.data;
        if (Array.isArray(this.weightProfileData) && this.weightProfileData?.length == 0) {
          // Handle empty data
        } else {
          this.creategGetWeightProfile(res.data);
        }
      },
      (err) => {
        this.toastr.error(err.error?.message || 'Error fetching weight profile data');
      }
    );
  }

  creategGetWeightProfile(item: any): void {
    const seriesData = [
      {
        name: '0.5 Kgs',
        y: item['0.5'],
        color: 'rgb(163, 161, 251)',
        dataLabels: {
          enabled: true,
          format: '{point.percent}',
        },
      },
      {
        name: '0.5-1 Kgs',
        y: item['0.5-1'],
        color: 'rgb(96, 235, 160)',
        dataLabels: {
          enabled: true,
          format: '{point.percent}',
        },
      },
      {
        name: '1-1.5 Kgs',
        y: item['1-1.5'],
        color: 'rgb(40, 95, 219)',
        dataLabels: {
          enabled: true,
          format: '{point.percent}',
        },
      },
      {
        name: '1.5-2 Kgs',
        y: item['1.5-2'],
        color: 'rgb(252, 160, 118)',
        dataLabels: {
          enabled: true,
          format: '{point.percent}',
        },
      },
      {
        name: '2-5 Kgs',
        y: item['2-5'],
        color: 'rgb(244, 122, 194)',
        dataLabels: {
          enabled: true,
          format: '{point.percent}',
        },
      },
      {
        name: '5+ Kgs',
        y: item['5+'],
        color: 'rgb(253, 236, 111)',
        dataLabels: {
          enabled: true,
          format: '{point.percent}',
        },
      },
    ];

    this.weightProfileGraph = {
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
      exporting: { enabled: false },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderWidth: 1,
        borderRadius: 5,
        padding: 10,
        shadow: true,
        shared: false,
        style: {
          fontSize: '12px'
        },
        followPointer: true,
        outside: false,
        useHTML: true,
        formatter: function () {
          const point = this as Highcharts.Point;
          const stackName = point.name;
          return (
            'Weight Profile: ' +
            stackName +
            '<br/> Total Shipments: <b>' +
            point.y +
            ' (' +
            parseInt(
              point.percentage ? point.percentage.toString() : '0'
            ) +
            '%)</b>'
          );
        },
      },
      credits: {
        enabled: false,
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
            },
          },
          center: ['50%', '50%'],
          size: 240,
          innerSize: '65%',
          showInLegend: true,
        },
      },
      series: [
        {
          name: 'Browsers',
          data: seriesData,
          type: 'pie',
          innerSize: '60%',
        },
      ],
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
        this.shipmentZoneData = res.data;
        if (this.shipmentZoneData?.length) {
          this.createShipmentZoneProfile(res.data);
        }
      },
      (err) => {
        this.toastr.error(err?.error?.message || 'Error fetching shipment zone data');
      }
    );
  }

  createShipmentZoneProfile(items: any): void {
    const zomeMap: any = {
      z_a: { name: 'Zone A', color: 'rgb(163, 161, 251)' },
      z_b: { name: 'Zone B', color: 'rgb(96, 235, 160)' },
      z_c: { name: 'Zone C', color: 'rgb(40, 95, 219)' },
      z_d: { name: 'Zone D', color: 'rgb(252, 160, 118)' },
      z_e: { name: 'Zone E', color: 'rgb(244, 122, 194)' },
    };

    const data: any = [];
    for (const item of items) {
      const graphData = {
        name: zomeMap[item.zone].name,
        y: item.count,
        color: zomeMap[item.zone].color,
        dataLabels: {
          enabled: true,
          format: '{point.percent}',
        },
      };
      data.push(graphData);
    }

    this.shipmentZoneGraph = {
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
      exporting: { enabled: false },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderWidth: 1,
        borderRadius: 5,
        padding: 10,
        shadow: true,
        shared: false,
        style: {
          fontSize: '12px'
        },
        followPointer: true,
        outside: false,
        useHTML: true,
        formatter: function () {
          const point = this as Highcharts.Point;
          const stackName = point.name;
          return (
            stackName +
            '<br/>Total Shipments: <b>' +
            this.y +
            '</b> (' +
            parseInt(
              point.percentage ? point.percentage.toString() : '0'
            ) +
            '%)'
          );
        },
      },
      credits: {
        enabled: false,
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
            },
          },
          center: ['50%', '50%'],
          size: 240,
          innerSize: '65%',
          showInLegend: true,
        },
      },
      series: [
        {
          name: 'Browsers',
          data: data,
          type: 'pie',
          innerSize: '60%',
        },
      ],
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
      },
      (err) => {
        this.toastr.error(err?.error?.message || 'Error fetching shipment count data');
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
      },
      (err) => {
        this.toastr.error(err?.error?.message || 'Error fetching previous shipment data');
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
}