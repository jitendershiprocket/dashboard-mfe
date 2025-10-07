import { Component, OnInit, ElementRef, ViewChild, ViewChildren, QueryList, CUSTOM_ELEMENTS_SCHEMA, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpService } from '../services/http-service.service';
import { DashboardFiltersComponent } from '../shared/components/dashboard-filters/dashboard-filters.component';
import { DateRange, FilterData, FilterValues } from '../shared/components/dashboard-filters/dashboard-filters.component';
import moment from 'moment';

@Component({
  selector: 'app-courier',
  standalone: true,
  imports: [CommonModule, FormsModule, DashboardFiltersComponent],
  templateUrl: './courier.html',
  styleUrl: './courier.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class CourierComponent implements OnInit {
  @ViewChild('courierDataWrap', { static: false }) courierDataWrap!: ElementRef;
  @ViewChildren('selectElement') selectElements!: QueryList<ElementRef>;
  @ViewChild('selectElementE') selectElementE!: ElementRef;
  
  startDate: any = moment().subtract(30, 'days').format('YYYY-MMM-DD');
  endDate: any = moment().subtract(1, 'days').format('YYYY-MMM-DD');
  hideAddCourier = false;
  courierResponse: any;
  zones: any;
  payment_methods: any;
  courier_modes: any;
  couriers: any;
  courierSelected: any;
  courierName: any;
  singleCourier: any;
  showNavArrow = false;
  image_sources: any = [
    { id: 1, source: 'https://app.shiprocket.in/app/img/courier/delhivery.png' },
    { id: 2, source: 'https://app.shiprocket.in/app/img/courier/blue-dart.png' },
    { id: 3, source: 'https://app.shiprocket.in/app/img/courier/amazon.png' },
    { id: 4, source: 'https://app.shiprocket.in/app/img/courier/ekart.png' },
    { id: 5, source: 'https://app.shiprocket.in/app/img/courier/fedex.png' },
    { id: 6, source: 'https://app.shiprocket.in/app/img/courier/gati.png' },
    { id: 7, source: 'https://app.shiprocket.in/app/img/courier/professional.png' },
    { id: 8, source: 'https://app.shiprocket.in/app/img/courier/dtdc.png' },
    { id: 9, source: 'https://app.shiprocket.in/app/img/courier/india-post.png' },
    { id: 10, source: 'https://app.shiprocket.in/app/img/courier/xpress-bees.png' }
  ];
  imgDataArray: any;
  slaTransportEst = {
    z_a: {
      air: 2,
      surface: 2,
    },
    z_b: {
      air: 3,
      surface: 3,
    },
    z_c: {
      air: 3,
      surface: 5,
    },
    z_d: {
      air: 5,
      surface: 7,
    },
    z_e: {
      air: 7,
      surface: 9,
    },
  };
  slaTransportSanitizedHtml: any;

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
    
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.slaTransportSanitizedHtml = {
      zone_a: `<b></b>Zone-A SLA<br> Air - ${this.slaTransportEst.z_a.air}<br>Surface - ${this.slaTransportEst.z_a.surface}</b>`,
      zone_b: `<b>Zone-B SLA<br> Air - ${this.slaTransportEst.z_b.air}<br>Surface - ${this.slaTransportEst.z_b.surface}</b>`,
      zone_c: `<b>Zone-C SLA<br> Air - ${this.slaTransportEst.z_c.air}<br>Surface - ${this.slaTransportEst.z_c.surface}</b>`,
      zone_d: `<b>Zone-D SLA<br> Air - ${this.slaTransportEst.z_d.air}<br>Surface - ${this.slaTransportEst.z_d.surface}</b>`,
      zone_e: `<b>Zone-E SLA<br> Air - ${this.slaTransportEst.z_e.air}<br>Surface - ${this.slaTransportEst.z_e.surface}</b>`,
    };
    this.getCourierData();
  }

  onDateRangeChange(range: DateRange): void {
    this.startDate = moment(range.start).format('YYYY-MMM-DD');
    this.endDate = moment(range.end).format('YYYY-MMM-DD');
    this.getCourierData();
  }

  onFilterChange(filterValues: FilterValues): void {
    this.currentFilterValues = { ...filterValues };
    this.getCourierData();
  }

  clearFilter(): void {
    this.currentFilterValues = {
      zones: [],
      courier: [],
      payment: [],
      shipment: ''
    };
    this.getCourierData();
  }
  
  addCourier(): void {
    this.hideAddCourier = true;
    this.showNavArrow = true;
    this.courierName[this.courierResponse.length] = 'choose'

    setTimeout(() => {
      const targetElement = document.getElementById('courier-data-wrap');
      if (targetElement && this.hideAddCourier) {
        targetElement.scrollLeft += 350;
      }
    });
  }

  scrollCourierWrapper(dir: any): void {
    const targetElement = document.getElementById('courier-data-wrap');
    if (dir === 'left' && targetElement) {
      targetElement.scrollLeft -= 350;
    } else if (dir === 'right' && targetElement) {
      targetElement.scrollLeft += 350;
    }
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

  getCourierData(): void {
    this.hideAddCourier = false;
    this.showNavArrow = false;
    const data = {
      start_date: this.startDate,
      end_date: this.endDate,
      zones: this.currentFilterValues.zones?.join(',') || '',
      payment_method: this.currentFilterValues.payment?.join(',') || '',
    };
    this.getdropDownOptions();
    this.http.srDashboardGet('2.0/courier/report', data).subscribe(
      (res) => {
        const courierNameArray = [];
        const courierNameArrayy = [];
        for (let i = 0; i < res.data.length; i++) {
          courierNameArray.push(res.data[i].courier_id.toString());
          courierNameArrayy.push(res.data[i].courier_id.toString());
        }
        this.courierName = courierNameArray;
        this.courierSelected = courierNameArrayy;
        this.courierResponse = res.data;
        this.getImage();
        this.cdr.markForCheck();
      },
      (err) => {
        console.error(err.error.message);
        this.cdr.markForCheck();
      }
    );
  }

  getdropDownOptions(): void {
    const data = {
      start_date: this.startDate,
      end_date: this.endDate,
      zones: this.currentFilterValues.zones?.join(',') || '',
      payment_method: this.currentFilterValues.payment?.join(',') || '',
    };

    this.http.srDashboardGet('getfilterdata').subscribe(
      (res) => {
        this.zones = res.data.zone;
        this.payment_methods = res.data.courier_type;
        this.courier_modes = res.data.courier_mode;
        this.cdr.markForCheck();
      },
      (err) => {
        console.error(err.error.message);
        this.cdr.markForCheck();
      }
    );
    this.http.srDashboardGet('2.0/courier/filterlist', data).subscribe(
      (res) => {
        this.couriers = res.data;
        this.cdr.markForCheck();
      },
      (err) => {
        console.error(err.error.message);
        this.cdr.markForCheck();
      }
    );
  }

  changeCourier(courier_id: any, index: any, courierAction: any, even: any): void {
    if (this.courierSelected.includes(courier_id.toString())) {
      console.info('Courier already Selected');
      if (courierAction === 'add') {
        this.courierName[this.courierResponse.length] = 'choose'
        this.selectElementE.nativeElement.value = 'choose';
      } else {
        this.selectElements.toArray()[index].nativeElement.value =
          this.courierSelected[index];
          this.courierName[index] = this.courierSelected[index];
      }
      
    } else {
      this.courierSelected[index] = courier_id.toString();
      const data = {
        start_date: this.startDate,
        end_date: this.endDate,
        zones: this.currentFilterValues.zones?.join(',') || '',
        payment_method: this.currentFilterValues.payment?.join(',') || '',
        courier: courier_id.toString(),
      };

      this.http.srDashboardGet('2.0/courier/report', data).subscribe(
        (res) => {
          this.singleCourier = res.data;
          this.courierName[index] = courier_id.toString();

          switch (courierAction) {
            case 'change':
              this.courierResponse[index] = this.singleCourier[0];
              break;
            case 'add':
              if (
                this.courierSelected.includes(
                  this.singleCourier[0].courier_id.toString()
                )
              ) {
                this.courierResponse[index] = this.singleCourier[0];
              } else {
                this.courierResponse.push(this.singleCourier[0]);
                this.courierSelected[index] =
                  this.singleCourier[0].courier_id.toString();
              }

              this.courierName[index + 1];
              this.hideAddCourier = false;
              break;
            default:
            // code block
          }

          this.getImage();
          this.cdr.markForCheck();
        },
        (err) => {
          console.error(err.error.message);
          this.cdr.markForCheck();
        }
      );
    }
  }

  getImage(): void {
    const data = [];
    for (let i = 0; i < this.courierResponse.length; i++) {
      for (let j = 0; j < this.image_sources.length; j++) {
        if (this.courierResponse[i].courier_id === this.image_sources[j].id) {
          data.push(this.image_sources[j].source);
          break;
        } else if (j + 1 === this.image_sources.length) {
          data.push('');
        }
      }
    }
    this.imgDataArray = data;
  }
}
