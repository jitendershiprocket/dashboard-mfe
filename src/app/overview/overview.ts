import { Component, ElementRef, OnInit, ViewChild, NO_ERRORS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpService } from '../services/http-service.service';
import { Chart } from 'angular-highcharts';
import * as Highcharts from 'highcharts/highmaps';
// import { HIGHCHARTS_MODULES } from 'angular-highcharts';
// import mapData from 'highcharts/modules/map';
import { ToastrService } from '../services/toastr.service';
import { AnalyticsService } from '../services/analytics.service';

// Simple utility function to get user data
function getUser() {
  const userData = localStorage.getItem('ngStorage-USER');
  return userData ? JSON.parse(userData) : { company_id: null };
}

// Analytics events constants
const ANALYTICS_EVENTS = {
  HOME: {
    BANNER_CLICKED: 'banner_clicked',
    BANNER_IMPRESSION_DELIVERED: 'banner_impression_delivered'
  }
};
@Component({
  selector: 'app-overview',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './overview.html',
  styleUrl: './overview.css',
  schemas: [NO_ERRORS_SCHEMA]
})
export class OverviewComponent {
  @ViewChild('carouselElement') carouselElement!: ElementRef;
  todaysData: any;
  shippingData: any;
  ndrData: any;
  ZoneData: any;
  avgshipCost: any;
  codStatuses: any;
  statuses: any;
  // shippingData: any;
  distributionData: any;
  donutChart: Highcharts.Options = {};
  shipmentDonutChart:  Highcharts.Options = {};
  deliveryDonutChart:  Highcharts.Options = {};
  // highcharts = Highcharts;
  updateFlag = false;
  pinotDistributionData : any;
  chartConstructor = 'mapChart'; // Use 'mapChart' constructor for maps
  Highcharts: typeof Highcharts = Highcharts;
  chartOptions: any;
  revenues: any;
  kycNewStrip = false;
  kycByPass: any;
  is_seller: any;
  kyc_status: any;
  bannerdata: any;
  courierSplitData: any;
  deliveryDonutData: any;
  mapData: any;
  domesticdata: any;
  pinotData: any;
  pinotRevenueData: any;
  mapFilterData = 'Order';
  totalShipmentToolTip = `Count of total shipments assigned in last 30 days excluding shipments in cancellation requested and cancelled status.<br><br>
  Note: The total count here is not the sum of values shown in previous columns`;
  lostDamagedToolTip = `The 'Lost/Damaged' count includes shipments marked as Lost, Damaged, Destroyed, and Disposed-Off`;
  companyID = getUser().company_id;
  constructor(
    private http: HttpService,
    private toastr: ToastrService,
    private analytics: AnalyticsService,
    
  ) {}

  ngOnInit(): void {
    this.createMapChart([], '', '');
    const data = localStorage.getItem('ngStorage-USER');
    this.kycNewStrip = data ? JSON.parse(data).is_kyc_new_strip : false;
    this.analytics.trackEvent("view_dashboard_dom", {});
    this.kycByPass = data ? JSON.parse(data).kyc_shipment_check_rb : '';

    this.kyc_status = data ? JSON.parse(data).kyc_status : '';
    this.is_seller = data ? JSON.parse(data).is_seller : '';
    
    // Load all data directly without NgRx
    this.getTodayData();
    this.sellerBanner();
    this.getShippingOverviewCombinedData();
    this.getavgShipCost();
    this.getCodData();
    this.getDeliveryPerformance();
    this.getRevenuesData();
    
    setTimeout(() => {
      this.getStateDataPinot('Order');
    }, 500);
    this.getPinotData();
    this.getDistributionDataPinot();
    this.getRevenueDetailsPinot();
  }
  onBannerClick(){    
      let data={
        company_id:this.companyID,
        banner_id:this.bannerdata[0]?.id,
        banner_position:'dashboard_top_carousel' ,
        redirect_url:this.bannerdata[0]?.landing_page,
        banner_name:this.bannerdata[0]?.description
      }
      
      this.analytics.trackEvent(ANALYTICS_EVENTS.HOME.BANNER_CLICKED, data);
    }
  openBannerLandingPage(url: any) {
    window.open(url?.landing_page);
    this.analytics.trackEvent(ANALYTICS_EVENTS.HOME.BANNER_CLICKED, {
      company_id:this.companyID,
      banner_id:url?.id,
      banner_position:'dashboard_top_carousel' ,
      redirect_url:url?.landing_page,
      banner_name:url?.description
      });
  }
  initializeCarouselEvents() {
    // Only set up events if there are multiple banners and carousel is enabled
    if (!this.bannerdata || this.bannerdata.length <= 1) {
      console.log('Carousel events not initialized: Not enough banners for auto-scroll');
      return;
    }

    // Wait for the carousel element to be available
    setTimeout(() => {
      if (this.carouselElement && this.carouselElement.nativeElement) {
        const carousel = this.carouselElement.nativeElement;
        
        // Check if carousel has auto-scroll enabled
        const hasAutoScroll = carousel.getAttribute('data-bs-ride') === 'carousel';
        
        if (!hasAutoScroll) {
          console.log('Carousel events not initialized: Auto-scroll not enabled');
          return;
        }

        console.log('Setting up carousel auto-scroll tracking for', this.bannerdata.length, 'banners');
        
        // Only listen for when slide completes (banner changes)
        carousel.addEventListener('slid.bs.carousel', (event: any) => {
          const activeIndex = event.to;
          const bannerItem = this.bannerdata[activeIndex];
          
          // console.log('Banner changed to index:', activeIndex, 'Banner:', bannerItem?.description);
          // console.log(bannerItem);
          
          
          // Track when banner changes
          this.analytics.trackEvent(ANALYTICS_EVENTS.HOME.BANNER_IMPRESSION_DELIVERED, {
            company_id: this.companyID,
            banner_id:bannerItem?.id,
            banner_position:'dashboard_top_carousel',
            banner_name:bannerItem?.description
          });
        });
      }
    }, 100);
  }
  sellerBanner() {
    this.http.get('shiprocket-pilot').subscribe(
      (res) => {
        if (res.top_banner !== null) {
          this.bannerdata = res.top_banner;
        }
        this.analytics.trackEvent(ANALYTICS_EVENTS.HOME.BANNER_IMPRESSION_DELIVERED, {
          company_id: this.companyID,
          banner_id:this.bannerdata[0]?.id,
          banner_position:'home_top_carousel',
          banner_name:this.bannerdata[0]?.description
        });
        this.initializeCarouselEvents();
      },
      (err) => {
        this.toastr.error(err?.error?.message);
      }
    );
  }
  getTodayData() {
    this.http.get('dashboard/todaydata').subscribe(
      (res) => {
        this.todaysData = res.data[0];
      },
      (err) => {
        this.toastr.error(err?.error?.message);
      }
    );
  }
  getPinotData() {
    this.http.getPinot('dashboard/details').subscribe(
      (res) => {
        this.pinotData = res.data;
        if(res.data?.shipment_details && res.data?.shipment_details.length > 0) this.createShipmentStatusDonutChart(res.data.shipment_details?.[0])
        if(res.data?.courier_split && res.data?.courier_split.length > 0) this.createDonutChart(res.data.courier_split);
      },
      (err) => {
        this.toastr.error(err?.error?.message);
      }
    );
  }

  getRevenueDetailsPinot() {
    this.http.getPinot('dashboard/revenue-data').subscribe(
      (res) => {
        this.pinotRevenueData = res.data;
      },
      (err) => {
        this.toastr.error(err?.error?.message);
      }
    );
  }

  getDistributionDataPinot() {
    this.http.getPinot('dashboard/shipment-courier-wise').subscribe(
      (res) => {
        this.pinotDistributionData = res.data.shipment_overview_by_courier;
      },
      (err) => {
        this.toastr.error(err?.error?.message);
      }
    );
  }

  getStateDataPinot(type: any) {
    this.http.getPinot('dashboard/statewise-data').subscribe(
      (res) => {
        this.mapCalculation(type, res);
      },
      (err) => {
        this.toastr.error(err?.error?.message);
      }
    );
  }

  getavgShipCost() {
    this.http.srDashboardGet('getavgshippingcost').subscribe(
      (res) => {
        this.avgshipCost = res.data[0];
      },
      (err) => {
        this.toastr.error(err?.error?.message);
      }
    );
  }

  getRevenuesData() {
    this.http.srDashboardGet('getrevenuedata').subscribe(
      (res) => {
        this.revenues = res.data[0];
      },
      (err) => {
        this.toastr.error(err?.error?.message);
      }
    );
  }

  getCodData() {
    this.http.get('account/details/remittance_summary').subscribe(
      (res) => {
        this.codStatuses = res;
      },
      (err) => {
        this.toastr.error(err?.error?.message);
      }
    );
    this.http.srDashboardGet('getcoddata').subscribe(
      (res) => {
        this.statuses = res.data;
      },
      (err) => {
        this.toastr.error(err?.error?.message);
      }
    );
  }

  getShippingOverviewCombinedData() {
    this.http.srDashboardGet('2.0/shipment/details').subscribe(
      (res) => {
        this.shippingData = res.data.shipping_data;
        this.ndrData = res.data.ndr_data;
        this.ZoneData = res.data.zone_wise_data;
        this.distributionData = res.data.courier_detailed;
        this.courierSplitData = res.data.courier_split;
        // this.createShipmentStatusDonutChart(res.data.shipping_data);
        // this.createDonutChart(res.data.courier_split);
      },
      (err) => {
        this.toastr.error(err?.error?.message);
      }
    );
  }
  getDeliveryPerformance() {
    this.http.srDashboardGet('delivery-performance').subscribe(
      (res) => {
        this.deliveryDonutData = res.data;
        this.createDeliveryPerformanceDonutChart(res.data);
      },
      (err) => {
        this.toastr.error(err?.error?.message);
      }
    );
  }

  createDonutChart(item: any) {
    const keys = Object.keys(item);
    const length = keys.length;
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

    for (let i = 0; i < length; i++) {
      const formatedData = {
        name: item[keys[i]].courier_name,
        y: item[keys[i]].total,
        custom: {
          total: this.convertIndianFormat(item[keys[i]].total),
        },
        order_count_percentage: item[keys[i]].percent,
        color: clr[i],
        dataLabels: {
          enabled: false,
          format: '{point.order_count_percentage}',
        },
      };
      chartData.push(formatedData);
    }
    
    this.donutChart = {
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
          '<table><tr><td>Shipment Count: </td><td align="right">{point.custom.total} ({point.percentage:.1f}%)</td></tr></table>'
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
      },
      series: [
        {
          name: 'Browsers',
          data: chartData,
          type: 'pie',
          innerSize: '60%',
        },
      ],
    };
  }
  createShipmentStatusDonutChart(item: any) {
    const clr = [
      //blue
      'rgb(163, 161, 251)',
      //green
      'rgb(96, 235, 160)',
      //shirocket blue
      'rgb(40, 95, 219)',
      //orange
      'rgb(252, 160, 118)',
      //pink
      'rgb(244, 122, 194)',
    ];

    const chartData = [
      {
        name: 'Delivered',
        y: item.delivered,
        custom: {
          name: 'Delivered Shipment',
          total: this.convertIndianFormat(item.delivered),
        },
        order_count_percentage:
          item.total_shipments > 0
            ? parseFloat(
                ((item.delivered / item.total_shipments) * 100).toFixed(2)
              )
            : 0,
        color: clr[0],
        dataLabels: {
          enabled: false,
          format: '{point.order_count_percentage}',
        },
      },
      {
        name: 'Intransit',
        y: item.in_transit,
        custom: {
          name: 'Intransit Shipment',
          total: this.convertIndianFormat(item.in_transit),
        },
        order_count_percentage:
          item.total_shipments > 0
            ? parseFloat(
                (((item.in_transit) / item.total_shipments) * 100).toFixed(
                  2
                )
              )
            : 0,
        color: clr[1],
        dataLabels: {
          enabled: false,
          format: '{point.order_count_percentage}',
        },
      },
      {
        name: 'Undelivered',
        y: item.undelivered,
        custom: {
          name: 'Undelivered Shipment',
          total: this.convertIndianFormat(item.undelivered),
        },
        order_count_percentage:
          item.total_shipments > 0
            ? parseFloat(
                ((item.undelivered / item.total_shipments) * 100).toFixed(2)
              )
            : 0,
        color: clr[2],
        dataLabels: {
          enabled: false,
          format: '{point.order_count_percentage}',
        },
      },
      {
        name: 'RTO',
        y: item.rto,
        custom: {
          name: 'RTO Shipment',
          total: this.convertIndianFormat(item.rto),
        },
        order_count_percentage:
          item.total_shipments > 0
            ? parseFloat(((item.rto / item.total_shipments) * 100).toFixed(2))
            : 0,
        color: clr[3],
        dataLabels: {
          enabled: false,
          format: '{point.order_count_percentage}',
        },
      },
      {
        name: 'Lost/Damaged',
        y: item.lost,
        custom: {
          name: 'Lost/Damaged Shipment',
          total: this.convertIndianFormat(item.lost),
        },
        order_count_percentage:
          item.total_shipments > 0
            ? parseFloat(((item.lost / item.total_shipments) * 100).toFixed(2))
            : 0,
        color: clr[4],
        dataLabels: {
          enabled: false,
          format: '{point.order_count_percentage}',
        },
      },
    ];

    this.shipmentDonutChart = {
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
          '<table><tr><td>{point.custom.name}: </td><td align="right">{point.custom.total} ({point.percentage:.1f}%)</td></tr></table>'
      },
      credits: {
        enabled: false,
      },
      legend: {
    itemStyle: {
      fontSize: '12px', 
      color: 'rgb(51, 51, 51)',
      cursor: 'pointer',
      fontWeight: 'bold',
      fill: 'rgb(51, 51, 51)',
    },
  },
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
          center: ['50%', '50%'],
        },
      },
      series: [
        {
          name: 'Browsers',
          data: chartData,
          type: 'pie',
          innerSize: '60%',
        },
      ],
    };
  }

  createDeliveryPerformanceDonutChart(item: any) {
    const clr = ['rgb(163, 161, 251)', 'rgb(252, 160, 118)'];

    const seriesData = [
      {
        name: 'Ontime Deliveries',
        y: item.ontime_delivery.count,
        custom: {
          name: 'Ontime Deliveries',
          total: this.convertIndianFormat(item.ontime_delivery.count),
        },
        order_count_percentage: item.ontime_delivery.percentage,
        color: clr[0],
        dataLabels: {
          enabled: false,
          format: '{point.order_count_percentage}',
        },
      },
      {
        name: 'Late Deliveries',
        y: item.late_delivery.count,
        custom: {
          name: 'Late Deliveries',
          total: this.convertIndianFormat(item.late_delivery.count),
        },
        order_count_percentage: item.late_delivery.percentage,
        color: clr[1],
        dataLabels: {
          enabled: false,
          format: '{point.order_count_percentage}',
        },
      },
    ];

    this.deliveryDonutChart = {
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
          '<table><tr><td>{point.custom.name}: </td><td align="right">{point.custom.total} ({point.percentage:.1f}%)</td></tr></table>'
      },
      credits: {
        enabled: false,
      },
      
      exporting: { enabled: false },
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
            distance: -50,
            style: {
              fontWeight: 'bold',
              color: 'white',
            },
          },
          startAngle: -90,
          endAngle: -180,
          center: ['50%', '50%'],
          innerSize: '65%',
          size: 240,
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

  convertIndianFormat(amt: any) {
    const amount = parseInt(amt);
    if (!isNaN(amount)) {
      // var currencySymbol = '₹';
      let result = amount.toString().split('.');
      var lastThree = result[0].substring(result[0].length - 3);
      var otherNumbers = result[0].substring(0, result[0].length - 3);
      if (otherNumbers != '') lastThree = ',' + lastThree;
      var output =
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

  switchDashboard(event: Event) {
    const type = (event.target as HTMLSelectElement).value;
    this.getStateDataPinot(type);
  }

  mapStateWithKey(state: string) {
    if(state == 'DELHI') return 'nct of delhi';
    if(state == 'ARUNACHAL PRADESH') return 'arunanchal pradesh';
    else return state
  }

  mapCalculation(type: string, res: any){
    this.mapData = res.data.state_wise_data;
    let items = res.data.state_wise_data;
    let format = '';
    let keys = Object.keys(res.data.state_wise_data);
    let length = keys.length;
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
      if (this.mapData && this.mapData.length>0) {
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

  getStateData(type: any) {
    this.http.srDashboardGet('getstatewisedata').subscribe(
      (res) => {
        this.mapCalculation(type, res);
      },
      (err) => {
        this.toastr.error(err?.error?.message);
      }
    );
  }

  async createMapChart(data: any, type: any, format: any) {
  
    const topology = await fetch(
      'https://code.highcharts.com/mapdata/countries/in/custom/in-all-disputed.topo.json'
    ).then(response => response.json());
    this.chartOptions = {
      chart: {
        map: topology,
      },
      title: {
        text: '',
      },
      tooltip: {
        useHTML: true,
        pointFormat: format,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderWidth: 1,
        borderRadius: 5,
        padding: 8,
        shadow: true,
        shared: false,
        style: {
          fontSize: '12px'
        },
        followPointer: true,
        outside: false,
      },
      exporting: { enabled: false },
      mapNavigation: {
        enabled: false,
        buttonOptions: {
          verticalAlign: 'bottom'
        }
      },
      colorAxis: {
        min: 0
      },
      series: [{
        type: 'map',
        name: type,
        data: data,
        borderColor: 'lightgray', 
        borderWidth: 1,   
        states: {
          hover: {
            color: '#503e7f'
          }
        },
        dataLabels: {
          enabled: false,
          format: '{point.name}'
        }
      }],
      credits: {
        enabled: false
      }
    };
    // Highcharts.mapChart('container', this.chartOptions);
  }
  newWebVersionKyc() {
    window.location.href = '/sellers/kyc';
  }


  isshipingDataDataNotEmpty(): boolean {
    if (this.shippingData && Object.keys(this.shippingData)?.length > 0) {
      for (const key in this.shippingData) {
        if (this.shippingData[key] > 0) {
          return true
        }
      }
      return false
    } else {
      return false;
    }
   
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
    if (
      this.deliveryDonutData &&
      Object.keys(this.deliveryDonutData)?.length > 0
    ) {
      return true
    } else {
      return false;
    }
   
  }

  
}
