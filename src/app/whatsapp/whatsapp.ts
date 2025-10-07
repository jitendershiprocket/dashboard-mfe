import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
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
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class WhatsappComponent implements OnInit {
  startDate: any = moment().subtract(30, 'days').format('YYYY-MMM-DD');
  endDate: any = moment().subtract(1, 'days').format('YYYY-MMM-DD');
  orderCount: any;
  whatsappData: any;
  
  // Chart.js properties
  public barType: 'bar' = 'bar' as const;
  message_sent_graph_data: ChartData<'bar'> = { labels: [], datasets: [] };
  message_sent_graph_options: ChartConfiguration<'bar'>['options'] = {};
  showmsgsent: any;

  constructor(
    private http: HttpService,
    private toastr: ToastrService
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
        this.orderCount = res.data;
      },
      (err) => {
        this.orderCount = false;
        this.toastr.error(err.error.message);
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
        this.whatsappData = res.data;

        if (this.whatsappData) {
          this.uniqVisitor(this.whatsappData.countData.chart);
        }
      },
      (err) => {
        this.whatsappData = false;
        this.toastr.error(err.error.message);
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
