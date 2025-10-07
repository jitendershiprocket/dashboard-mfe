import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { HttpService } from '../services/http-service.service';
import { DashboardFiltersComponent, FilterData, FilterValues, DateRange } from '../shared/components/dashboard-filters/dashboard-filters.component';
import moment from 'moment';

@Component({
  selector: 'app-delays',
  standalone: true,
  imports: [CommonModule, FormsModule, DashboardFiltersComponent],
  templateUrl: './delays.html',
  styleUrl: './delays.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class DelaysComponent implements OnInit {
  startDate: any = moment().subtract(30, 'days').format('YYYY-MMM-DD');
  endDate: any = moment().subtract(1, 'days').format('YYYY-MMM-DD');
  
  // Data properties
  status: any;
  pickupPendency: any;
  pickupPendencyHasData: any;
  ndrReattempt: any;
  ndrReattemptHasData: any;
  inTransit: any;
  sanitizedInTransitHtml: any;
  inTransitHasData: any;
  inTransitArray: any;
  rtoArray: any;
  rto: any;
  sanitizedRtoHtml: any;
  rtoHasData: any;
  radArray: any;
  rad: any;
  radHasData: any;

  // Filter properties
  filterData: FilterData = {
    zone: [],
    courier: [],
    courier_type: [],
    courier_mode: []
  };

  currentFilterValues: FilterValues = {
    zones: [],
    courier: [],
    payment: [],
    shipment: ''
  };

  dateRange: DateRange = {
    start: this.startDate,
    end: this.endDate
  };

  constructor(
    private http: HttpService,
    
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.callAllFunctions();
  }

  onDateRangeChange(range: DateRange): void {
    this.startDate = moment(range.start).format('YYYY-MMM-DD');
    this.endDate = moment(range.end).format('YYYY-MMM-DD');
    this.dateRange = range;
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

  getStatus() {
    const data = {
      start_date: this.startDate,
      end_date: this.endDate,
      courier_mode: this.currentFilterValues.shipment || '',
      courier: this.currentFilterValues.courier?.join(',') || '',
      payment_method: this.currentFilterValues.payment?.join(',') || '',
      zones: this.currentFilterValues.zones?.join(',') || '',
    };

    this.http.srDashboardGet('2.0/delay/stats', data).subscribe(
      (res: any) => {
        this.status = res.data;
        this.cdr.markForCheck();
      },
      (err: any) => {
        console.error(err.error.message);
        this.cdr.markForCheck();
      }
    );
  }

  numFormat(num: any) {
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

  getPickupPendency() {
    const data = {
      start_date: this.startDate,
      end_date: this.endDate,
      courier_mode: this.currentFilterValues.shipment || '',
      courier: this.currentFilterValues.courier?.join(',') || '',
      payment_method: this.currentFilterValues.payment?.join(',') || '',
      zones: this.currentFilterValues.zones?.join(',') || '',
    };

    this.http.srDashboardGet('2.0/delay/pickup', data).subscribe(
      (res: any) => {
        this.pickupPendency = res.data;
        this.pickupPendencyHasData = this.checkDataExist(this.pickupPendency);
        this.cdr.markForCheck();
      },
      (err: any) => {
        console.error(err.error.message);
        this.cdr.markForCheck();
      }
    );
  }

  checkDataExist(data: any) {
    if (Array.isArray(data) && data.length == 0) {
      return false;
    } else {
      return true;
    }
  }

  getNDR() {
    const data = {
      start_date: this.startDate,
      end_date: this.endDate,
      courier_mode: this.currentFilterValues.shipment || '',
      courier: this.currentFilterValues.courier?.join(',') || '',
      payment_method: this.currentFilterValues.payment?.join(',') || '',
      zones: this.currentFilterValues.zones?.join(',') || '',
    };

    this.http.srDashboardGet('2.0/delay/ndr', data).subscribe(
      (res: any) => {
        const data: any = [];
        for (const key in res.data) {
          data.push(res.data[key]);
        }
        this.ndrReattempt = data;
        this.ndrReattemptHasData = this.checkDataExist(this.ndrReattempt);
        this.cdr.markForCheck();
      },
      (err: any) => {
        console.error(err.error.message);
        this.cdr.markForCheck();
      }
    );
  }

  getTransit() {
    const data = {
      start_date: this.startDate,
      end_date: this.endDate,
      courier_mode: this.currentFilterValues.shipment || '',
      courier: this.currentFilterValues.courier?.join(',') || '',
      payment_method: this.currentFilterValues.payment?.join(',') || '',
      zones: this.currentFilterValues.zones?.join(',') || '',
    };

    this.http.srDashboardGet('2.0/delay/in-transit', data).subscribe(
      (res: any) => {
        const data: any = [];
        for (const key in res.data) {
          data.push(res.data[key]);
        }
        this.inTransitArray = data;
        this.inTransit = res.data;
        this.sanitizedInTransitHtml = {
          zone_a: `<b>SLA for Zone A <br> Air - <span>${this.inTransit?.z_a?.expected_sla?.air} Days</span> <br> Surface - <span>${this.inTransit?.z_a?.expected_sla?.surface} Days</span></b>`,
          zone_b: `<b>SLA for Zone B <br> Air - <span>${this.inTransit?.z_b?.expected_sla?.air} Days</span> <br> Surface - <span>${this.inTransit?.z_b?.expected_sla?.surface} Days</span></b>`,
          zone_c: `<b>SLA for Zone C <br> Air - <span>${this.inTransit?.z_c?.expected_sla?.air} Days</span> <br> Surface - <span>${this.inTransit?.z_c?.expected_sla?.surface} Days</span></b>`,
          zone_d: `<b>SLA for Zone D <br> Air - <span>${this.inTransit?.z_d?.expected_sla?.air} Days</span> <br> Surface - <span>${this.inTransit?.z_d?.expected_sla?.surface} Days</span></b>`,
          zone_e: `<b>SLA for Zone E <br> Air - <span>${this.inTransit?.z_e?.expected_sla?.air} Days</span> <br> Surface - <span>${this.inTransit?.z_e?.expected_sla?.surface} Days</span></b>`,
        };
        this.inTransitHasData = this.checkDataExist(this.inTransitArray);
        this.cdr.markForCheck();
      },
      (err: any) => {
        console.error(err.error.message);
        this.cdr.markForCheck();
      }
    );
  }

  getRTO() {
    const data = {
      start_date: this.startDate,
      end_date: this.endDate,
      courier_mode: this.currentFilterValues.shipment || '',
      courier: this.currentFilterValues.courier?.join(',') || '',
      payment_method: this.currentFilterValues.payment?.join(',') || '',
      zones: this.currentFilterValues.zones?.join(',') || '',
    };

    this.http.srDashboardGet('2.0/delay/rto', data).subscribe(
      (res: any) => {
        const data: any = [];
        for (const key in res.data) {
          data.push(res.data[key]);
        }
        this.rtoArray = data;
        this.rto = res.data;
        this.sanitizedRtoHtml = {
          zone_a: `<b>RTO SLA for Zone A <br> Air - <span>${this.rto?.z_a?.expected_sla?.air} Days</span> <br> Surface - <span>${this.rto?.z_a?.expected_sla?.surface} Days</span></b>`,
          zone_b: `<b>RTO SLA for Zone B <br> Air - <span>${this.rto?.z_b?.expected_sla?.air} Days</span> <br> Surface - <span>${this.rto?.z_b?.expected_sla?.surface} Days</span></b>`,
          zone_c: `<b>RTO SLA for Zone C <br> Air - <span>${this.rto?.z_c?.expected_sla?.air} Days</span> <br> Surface - <span>${this.rto?.z_c?.expected_sla?.surface} Days</span></b>`,
          zone_d: `<b>RTO SLA for Zone D <br> Air - <span>${this.rto?.z_d?.expected_sla?.air} Days</span> <br> Surface - <span>${this.rto?.z_d?.expected_sla?.surface} Days</span></b>`,
          zone_e: `<b>RTO SLA for Zone E <br> Air - <span>${this.rto?.z_e?.expected_sla?.air} Days</span> <br> Surface - <span>${this.rto?.z_e?.expected_sla?.surface} Days</span></b>`,
        };
        this.rtoHasData = this.checkDataExist(this.rto);
        this.cdr.markForCheck();
      },
      (err: any) => {
        console.error(err.error.message);
        this.cdr.markForCheck();
      }
    );
  }

  getRAD() {
    const data = {
      start_date: this.startDate,
      end_date: this.endDate,
      courier_mode: this.currentFilterValues.shipment || '',
      courier: this.currentFilterValues.courier?.join(',') || '',
      payment_method: this.currentFilterValues.payment?.join(',') || '',
      zones: this.currentFilterValues.zones?.join(',') || '',
    };

    this.http.srDashboardGet('2.0/delay/rad', data).subscribe(
      (res: any) => {
        const data: any = [];
        for (const key in res.data) {
          data.push(res.data[key]);
        }
        this.radArray = data;
        this.rad = res.data;
        this.radHasData = this.checkDataExist(this.rad);
        this.cdr.markForCheck();
      },
      (err: any) => {
        console.error(err.error.message);
        this.cdr.markForCheck();
      }
    );
  }

  callAllFunctions() {
    this.getStatus();
    this.getPickupPendency();
    this.getNDR();
    this.getTransit();
    this.getRTO();
    this.getRAD();
  }
}
