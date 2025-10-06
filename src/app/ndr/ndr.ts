import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpService } from '../services/http-service.service';
import { ToastrService } from '../services/toastr.service';
import { AnalyticsService } from '../services/analytics.service';
import { DashboardFiltersComponent } from '../shared/components/dashboard-filters/dashboard-filters.component';
import { FilterData, FilterValues, DateRange } from '../shared/components/dashboard-filters/dashboard-filters.component';
import moment from 'moment';
import * as Highcharts from 'highcharts';

@Component({
  selector: 'app-ndr',
  standalone: true,
  imports: [CommonModule, FormsModule, DashboardFiltersComponent],
  templateUrl: './ndr.html',
  styleUrl: './ndr.css',
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
  
  Highcharts: typeof Highcharts = Highcharts;
  ndrSplit: any;
  showNdrSplitGraph: any;
  ndrDeliveredAttempt: any;
  ndrStatusData: any;
  ndrReasonData: any;
  ndrResponseData: any;
  ndrSellerBuyerResponse: any;
  ndrFunnel: any;
  ndr_split: Highcharts.Options = {};
  showNdrStatusGraph: any;
  ndrStatusDataChart: any;
  ndr_status: Highcharts.Options = {};
  totalNdrRaised: any;
  ndrResponseSeller: any;
  ndrResponseSellerPositive: any;
  ndrResponseBuyer: any;
  ndrResponseBuyerPositive: any;
  ndr_delivery_attempt: Highcharts.Options = {};
  ndrDeliveryAttemptChart: any;
  ndrSellerResponseDataChart: any;
  ndrBuyerResponseDataChart = false;
  ndr_seller_response: Highcharts.Options = {};
  ndr_buyer_response: Highcharts.Options = {};
  ndrSuccessData: any;
  showHideCourier = false;

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
    private analyticsService: AnalyticsService
  ) {}

  ngOnInit(): void {
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
    const seriesData: any = [
      {
        name: 'NDR Raised',
        type: 'column',
        color: 'rgb(96, 235, 160)',
        data: [2,5,3],
      },
      {
        name: 'Delivery Attempt',
        type: 'line',
        color: 'rgb(252, 160, 118)',
        data: [2,5,3],
      },
    ];
    
    this.ndr_delivery_attempt = {
      chart: {
        type: 'column',
        height: 400,
      },
      title: {
        text: '',
      },
      xAxis: [
        {
          crosshair: true,
        },
      ],
      yAxis: {
        min: 0,
        gridLineWidth: 0,
        title: {
          text: '',
        },
      },
      credits: {
        enabled: false,
      },
      exporting: {
        enabled: false,
      },
      legend: {
        align: 'right',
        verticalAlign: 'top',
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
          '<table><tr><td>{series.name} : </td><td align="right"><b>{point.custom}</b></td></tr></table>',
      },
      plotOptions: {
        column: {
          maxPointWidth: 20,
        },
      },
      series: seriesData
    };
    
    this.ndr_seller_response = {
      chart: {
        type: 'column',
        height: 400,
      },
      title: {
        text: '',
      },
      xAxis: [
        {
          crosshair: true,
        },
      ],
      yAxis: {
        min: 0,
        gridLineWidth: 0,
        title: {
          text: '',
        },
      },
      credits: {
        enabled: false,
      },
      exporting: {
        enabled: false,
      },
      legend: {
        align: 'right',
        verticalAlign: 'top',
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
          '<table><tr><td>{series.name} : </td><td align="right"><b>{point.custom}</b></td></tr></table>',
      },
      plotOptions: {
        column: {
          maxPointWidth: 20,
        },
      },
      series: [...seriesData, {
        name: 'Delivery Attempt',
        type: 'line',
        color: 'rgb(252, 160, 118)',
        data: [4,54,2],
      }]
    };
    
    this.ndr_buyer_response = {
      chart: {
        type: 'column',
        height: 400,
      },
      title: {
        text: '',
      },
      xAxis: [
        {
          crosshair: true,
        },
      ],
      yAxis: {
        min: 0,
        gridLineWidth: 0,
        title: {
          text: '',
        },
      },
      credits: {
        enabled: false,
      },
      exporting: {
        enabled: false,
      },
      legend: {
        align: 'right',
        verticalAlign: 'top',
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
          '<table><tr><td>{series.name} : </td><td align="right"><b>{point.custom}</b></td></tr></table>',
      },
      plotOptions: {
        column: {
          maxPointWidth: 20,
        },
      },
      series: [...seriesData, {
        name: 'Delivery Attempt',
        type: 'line',
        color: 'rgb(252, 160, 118)',
        data: [4,54,2],
      }]
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
    
    this.http.get('2.0/ndr/reasons', data).subscribe(
      (res: any) => {
        this.getActionRequiredCount();
        this.getShipmentsCount();
        this.allNdrData.ndr_raised_count = res.data.overall.ndr_raised_count;
        this.allNdrData.ndr_delivered_count = res.data.overall.ndr_delivered_count;
        this.allNdrData.ndr_rto_count = res.data.overall.ndr_rto_count;

        this.ndrSplit = res.data.reason_chart;
        if (this.ndrSplit.length) {
          this.showNdrSplitGraph = true;
          this.createndrReasonSplitChart(this.ndrSplit);
        } else {
          this.showNdrSplitGraph = false;
        }

        this.ndrDeliveredAttempt = res.data.delivery_attempt;
        this.makeNDRDeliveryAttemptChart();

        this.ndrStatusData = res.data.status_chart;
        this.showNdrStatusGraph = true;
        this.makeNDRStatusChart();

        this.ndrReasonData = res.data.reason_wise_split;
      },
      (err) => {
        this.toastr.error(err.error.message);
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
    
    this.http.get('2.0/ndr/action-required', data).subscribe(
      (res: any) => {
        this.allNdrData.ndr_action_required = res.data.ndr_action_required;
      },
      (err) => {
        this.toastr.error(err.error.message);
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
    
    this.http.get('2.0/ndr/all-response', data).subscribe(
      (res: any) => {
        this.ndrResponseData = res.data.matrix;
        this.ndrSellerBuyerResponse = res.data.grouped;
        this.makeSellerBuyerResponseChart();
      },
      (err) => {
        this.toastr.error(err.error.message);
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
    
    this.http.get('2.0/ndr/shipments', data).subscribe(
      (res: any) => {
        this.allNdrData.shipment_count = res.data.shipment_count;
      },
      (err) => {
        this.toastr.error(err.error.message);
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
    
    this.http.get('2.0/getndrfunnel', data).subscribe(
      (res: any) => {
        this.ndrFunnel = res.data;
      },
      (err) => {
        this.toastr.error(err.error.message);
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
    
    this.http.get('2.0/ndr/detailed', data).subscribe(
      (res: any) => {
        this.totalNdrRaised = res.data.overall;
        this.ndrResponseSeller = res.data.seller.overall;
        this.ndrResponseSellerPositive = res.data.seller.positive;
        this.ndrResponseBuyer = res.data.buyer.overall;
        this.ndrResponseBuyerPositive = res.data.buyer.positive;
      },
      (err) => {
        this.toastr.error(err.error.message);
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
    
    this.http.get('2.0/ndrSuccess', data).subscribe(
      (res: any) => {
        this.ndrSuccessData = res.data;
      },
      (err) => {
        this.toastr.error(err.error.message);
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
      this.ndr_split = {
          chart: {
            plotBackgroundColor: '#fff',
            plotBorderWidth: 0,
            plotShadow: false,
            height: 275,
          },
          title: {
            text: '',
            align: 'center',
            verticalAlign: 'middle',
            y: 0,
          },
          legend: {
            enabled: false,
            itemStyle: {
              fontSize: '12px',
              fontWeight: 'bold'
            }
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
              '<table><tr><td>Total : </td><td align="right"><b>{point.custom.axis_y}({point.custom.percent_custom}%)</b></td></tr></table>',
          },
          credits: {
            enabled: false,
          },
          exporting: { enabled: false },
          plotOptions: {
            pie: {
              dataLabels: {
                enabled: true,
                distance: -28,
              },
              borderWidth: 3,
              showInLegend: true,
              innerSize: '65%',
              size: 240,
              center: ['50%', posCenter],
            },
            series: {
              point: {
                events: {
                  legendItemClick: function () {
                    return false; // <== returning false will cancel the default action
                  },
                },
              },
            },
          },
          series: [
            {
              data: chartData,
              type: 'pie',
              innerSize: '60%',
            },
          ],
      };
    } else {
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
      const seriesData: any = [
        {
          name: 'NDR Raised',
          type: 'column',
          color: 'rgb(96, 235, 160)',
          data: ndrRaisedData,
        },
        {
          name: 'Delivery Attempt',
          type: 'line',
          color: 'rgb(252, 160, 118)',
          data: ndrDelivereddData,
        },
      ];
      if (this.ndrDeliveryAttemptChart) {
        this.ndr_delivery_attempt = {
          chart: {
            // zoomType: 'xy',
            type: 'column',
            height: 400,
            // height: 275,
          },
          title: {
            text: '',
          },
          xAxis: [
            {
              labels: {
              style: {
                fontSize: '11px'
              }
            },  
              categories: keys,
              crosshair: true,
              lineColor: '#ccd6eb',
              lineWidth: 1,
            },
          ],
          yAxis: {
            labels: {
              style: {
                fontSize: '11px'
              }
            },
            min: 0,
            gridLineWidth: 0,
            title: {
              text: '',
            },
          },
          credits: {
            enabled: false,
          },
          exporting: {
            enabled: false,
          },
         
          legend: {
            align: 'right',
            verticalAlign: 'top',
            itemStyle: {
              fontSize: '12px',
              fontWeight: 'bold'
            }
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
              '<table><tr><td>{series.name} : </td><td align="right"><b>{point.custom}</b></td></tr></table>',
          },
          plotOptions: {
            column: {
              maxPointWidth: 20,
            },
          },
          series: seriesData,
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
        this.ndr_status = {
          chart: {
            type: 'column',
            height: 275,
          },
          colors: clr,
          title: {
            text: '',
          },
          xAxis: {
            categories: keys,
            labels: {
              style: {
                fontSize: '11px'
              }
            },
            lineColor: '#ccd6eb',
            lineWidth: 1,
          },
          yAxis: {
            gridLineWidth: 0,
            min: 0,
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
          credits: {
            enabled: false,
          },
          exporting: {
            enabled: false,
          },
          legend: {
            reversed: true,
            align: 'right',
            verticalAlign: 'top',
            itemStyle: {
      fontSize: '12px', 
      fontWeight: 'bold'
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
            pointFormat:
              '<table><tr><td>{series.name} : </td><td align="right"><b>{point.custom}</b></td></tr></table>',
          },
          plotOptions: {
            column: {
              stacking: 'normal',
              pointWidth: 20,
            },
          },
          series: formatedSeries,
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
        this.ndr_seller_response = {
          chart: {
            height: 400,
          },
          title: {
            text: '',
          },
          xAxis: [
            {
              labels: {
                style: {
                  fontSize: '11px'
                }
              },
              categories: keys,
              crosshair: true,
              lineColor: '#ccd6eb',
              lineWidth: 1,
            },
          ],
          yAxis: {
            labels: {
              style: {
                fontSize: '11px'
              }
            },
            gridLineWidth: 1,
            gridLineColor: '#ececec',
            min: 0,
            title: {
              text: '',
            },
          },
          credits: {
            enabled: false,
          },
          exporting: {
            enabled: false,
          },
          legend: {
            align: 'right',
            verticalAlign: 'top',
            itemStyle: {
              textOverflow: 'initial',
              whiteSpace: 'initial',
              width: 95,
              fontSize: '12px',
              fontWeight: 'bold'
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
            pointFormat:
              '<table><tr><td>{series.name} : </td><td text-align="right"><b>{point.custom}</b></td></tr></table>',
          },
          plotOptions: {
            column: {
              maxPointWidth: 20,
            },
          },
          series: [
            {
              name: 'NDR',
              type: 'column',
              color: 'rgb(253, 225, 123)',
              data: ndrData,
            },
            {
              name: 'Seller Response',
              type: 'column',
              color: 'rgb(163, 161, 251)',
              data: ndrSellerResponsedData,
            },
            {
              name: 'Seller +ve Response',
              type: 'line',
              color: 'rgb(96, 235, 160)',
              data: ndrSellerPositiveResponsedData,
            },
          ],
        };
      }

      if (this.ndrBuyerResponseDataChart) {
        this.ndr_buyer_response = {
          chart: {
            height: 400,
          },
          title: {
            text: '',
          },
          credits: {
            enabled: false,
          },
          exporting: {
            enabled: false,
          },
          xAxis: [
            {
              labels: {
                style: {
                  fontSize: '11px'
                }
              },
              categories: keys,
              crosshair: true,
              lineColor: '#ccd6eb',
              lineWidth: 1,
            },
          ],
          yAxis: {
            labels: {
              style: {
                fontSize: '11px'
              }
            },
            gridLineWidth: 1,
            gridLineColor: '#ececec',
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
            pointFormat:
              '<table><tr><td>{series.name} : </td><td align="right"><b>{point.custom}</b></td></tr></table>',
          },
          plotOptions: {
            column: {
              maxPointWidth: 20,
            },
          },
          legend: {
            align: 'right',
            verticalAlign: 'top',
            itemStyle: {
              textOverflow: 'initial',
              whiteSpace: 'initial',
              width: 95,
              fontSize: '12px',
              fontWeight: 'bold'
            },
            
          },
          series: [
            {
              name: 'NDR',
              type: 'column',
              color: 'rgb(253, 225, 123)',
              data: ndrData,
            },
            {
              name: 'Buyer Response',
              type: 'column',
              color: 'rgb(244, 122, 194)',
              data: ndrBuyerResponsedData,
            },
            {
              name: 'Buyer +ve Response',
              type: 'line',
              color: 'rgb(163, 161, 251)',
              data: ndrBuyerPositiveResponsedData,
            },
          ],
        };
      }
    } else {
      // $scope.showNdrSellerBuyerResponseGraph = false;
    }
  }
}
