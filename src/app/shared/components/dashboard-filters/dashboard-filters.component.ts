import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface FilterOption {
  value: string;
  display_value: string;
}

export interface FilterData {
  zone?: FilterOption[];
  courier?: FilterOption[];
  courier_type?: FilterOption[];
  courier_mode?: FilterOption[];
}

export interface FilterValues {
  zones?: string[];
  courier?: string[];
  payment?: string[];
  shipment?: string;
}

export interface DateRange {
  start: string;
  end: string;
}

@Component({
  selector: 'app-dashboard-filters',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard-filters.component.html',
  styleUrls: ['./dashboard-filters.component.css']
})
export class DashboardFiltersComponent implements OnInit {
  @Input() filterData: FilterData = {};
  @Input() showDatePicker: boolean = true;
  @Input() showZoneFilter: boolean = true;
  @Input() showCourierFilter: boolean = true;
  @Input() showPaymentFilter: boolean = true;
  @Input() showShipmentFilter: boolean = true;
  @Input() showClearButton: boolean = true;
  @Input() dateRange: DateRange = {
    start: '',
    end: ''
  };

  @Output() dateRangeChange = new EventEmitter<DateRange>();
  @Output() filterChange = new EventEmitter<FilterValues>();
  @Output() clearFilters = new EventEmitter<void>();

  // Local filter values
  localFilterValues: FilterValues = {
    zones: [],
    courier: [],
    payment: [],
    shipment: ''
  };

  hasActiveFilters = false;

  constructor() {}

  ngOnInit(): void {
    this.checkActiveFilters();
  }

  onDateRangeChange(startDate: string, endDate: string): void {
    const newRange: DateRange = {
      start: startDate,
      end: endDate
    };
    this.dateRangeChange.emit(newRange);
  }

  onZoneChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.localFilterValues.zones = target.value ? [target.value] : [];
    this.checkActiveFilters();
    this.emitFilterChange();
  }

  onCourierChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.localFilterValues.courier = target.value ? [target.value] : [];
    this.checkActiveFilters();
    this.emitFilterChange();
  }

  onPaymentChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.localFilterValues.payment = target.value ? [target.value] : [];
    this.checkActiveFilters();
    this.emitFilterChange();
  }

  onShipmentChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.localFilterValues.shipment = target.value;
    this.checkActiveFilters();
    this.emitFilterChange();
  }

  clearAllFilters(): void {
    this.localFilterValues = {
      zones: [],
      courier: [],
      payment: [],
      shipment: ''
    };
    this.hasActiveFilters = false;
    this.clearFilters.emit();
  }

  private checkActiveFilters(): void {
    this.hasActiveFilters = !!(
      (this.localFilterValues.zones && this.localFilterValues.zones.length > 0) ||
      (this.localFilterValues.courier && this.localFilterValues.courier.length > 0) ||
      (this.localFilterValues.payment && this.localFilterValues.payment.length > 0) ||
      this.localFilterValues.shipment
    );
  }

  private emitFilterChange(): void {
    this.filterChange.emit({ ...this.localFilterValues });
  }

  // Utility method to get default date range (last 30 days)
  getDefaultDateRange(): DateRange {
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));
    return {
      start: thirtyDaysAgo.toISOString().split('T')[0],
      end: today.toISOString().split('T')[0]
    };
  }
}
