import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA, ChangeDetectionStrategy, ChangeDetectorRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpService } from '../services/http-service.service';
import { ToastrService } from '../services/toastr.service';
import { DashboardFiltersComponent } from '../shared/components/dashboard-filters/dashboard-filters.component';
import { DateRange } from '../shared/components/dashboard-filters/dashboard-filters.component';
import moment from 'moment';
import { BaseChartDirective } from 'ng2-charts';
import { Chart, ChartConfiguration, ChartData, BarElement, CategoryScale, LinearScale, BarController, Tooltip, Legend } from 'chart.js';

@Component({
  selector: 'app-whatsapp',
  standalone: true,
  imports: [CommonModule, FormsModule, DashboardFiltersComponent, BaseChartDirective],
  templateUrl: './whatsapp.html',
  styleUrl: './whatsapp.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class WhatsappComponent implements OnInit {
  startDate: any = moment().subtract(30, 'days').format('YYYY-MMM-DD');
  endDate: any = moment().subtract(1, 'days').format('YYYY-MMM-DD');
  private _orderCount = signal<any>(null);
  private _whatsappData = signal<any>(null);
  
  // Chart.js properties
  public barType: 'bar' = 'bar' as const;
  message_sent_graph_data: ChartData<'bar'> = { labels: [], datasets: [] };
  message_sent_graph_options: ChartConfiguration<'bar'>['options'] = {};
  showmsgsent: any;

  // Compatibility getters for template
  get orderCount() { return this._orderCount(); }
  get whatsappData() { return this._whatsappData(); }

  constructor(
    private http: HttpService,
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    Chart.register(BarElement, CategoryScale, LinearScale, BarController, Tooltip, Legend);
    this.getorderCount();
    this.getstats();
  }

  onDateRangeChange(range: DateRange): void {
    this.startDate = moment(range.start).format('YYYY-MMM-DD');
    this.endDate = moment(range.end).format('YYYY-MMM-DD');
    this.getorderCount();
    this.getstats();
  }

  getorderCount() {
    const data = {
      from: this.startDate,
      to: this.endDate,
    };
    
    this.http.get('vas/getOrdersCountWhatsapp', data).subscribe(
      (res) => {
        this._orderCount.set(res.data);
        this.cdr.markForCheck();
      },
      (err) => {
        this._orderCount.set(false);
        this.toastr.error(err.error.message);
        this.cdr.markForCheck();
      }
    );
  }

  getstats() {
    const data = {
      from: this.startDate,
      to: this.endDate,
    };
    
    this.http.get('settings/whatsapp-dashboard/listing', data).subscribe(
      (res) => {
        this._whatsappData.set(res.data);

        if (this._whatsappData()) {
          this.uniqVisitor(this._whatsappData().countData.chart);
        }
        this.cdr.markForCheck();
      },
      (err) => {
        this._whatsappData.set(false);
        this.toastr.error(err.error.message);
        this.cdr.markForCheck();
      }
    );
  }

  uniqVisitor(uniqueVisitorsData: any) {
    let count = 0;
    for (const key in uniqueVisitorsData) {
      if (uniqueVisitorsData[key] != 0) {
        count++;
      }
    }
    if (count > 0) {
      this.showmsgsent = true;
    } else {
      this.showmsgsent = false;
    }

    const uniqVisitorsDate = [];
    const uniqVisitorsCount = [];
    for (const key in uniqueVisitorsData) {
      uniqVisitorsDate.push(key);
      uniqVisitorsCount.push(Number(uniqueVisitorsData[key]));
    }

    this.message_sent_graph_data = {
      labels: uniqVisitorsDate,
      datasets: [{
        label: 'Messages Sent',
        data: uniqVisitorsCount,
        backgroundColor: '#FCA876',
        borderWidth: 0
      }]
    };
    this.message_sent_graph_options = {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: { enabled: true }
      },
      scales: {
        x: { beginAtZero: true },
        y: { beginAtZero: true }
      }
    };
  }
}
