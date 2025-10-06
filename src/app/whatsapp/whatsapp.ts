import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpService } from '../services/http-service.service';
import { ToastrService } from '../services/toastr.service';
import { DashboardFiltersComponent } from '../shared/components/dashboard-filters/dashboard-filters.component';
import { DateRange } from '../shared/components/dashboard-filters/dashboard-filters.component';
import moment from 'moment';
import * as Highcharts from 'highcharts';

@Component({
  selector: 'app-whatsapp',
  standalone: true,
  imports: [CommonModule, FormsModule, DashboardFiltersComponent],
  templateUrl: './whatsapp.html',
  styleUrl: './whatsapp.css',
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class WhatsappComponent implements OnInit {
  startDate: any = moment().subtract(30, 'days').format('YYYY-MMM-DD');
  endDate: any = moment().subtract(1, 'days').format('YYYY-MMM-DD');
  orderCount: any;
  whatsappData: any;
  Highcharts: typeof Highcharts = Highcharts;
  message_sent_graph: Highcharts.Options = {};
  showmsgsent: any;

  constructor(
    private http: HttpService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
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
      uniqVisitorsCount.push({
        y: Number(uniqueVisitorsData[key]),
        date: key,
      });
    }

    this.message_sent_graph = {
      colors: ['#FCA876'],
      title: {
        text: '',
      },
      credits: {
        enabled: false,
      },
      exporting: { enabled: false },
      chart: {
        type: 'column',
        height: 300,
      },
      legend: {
        enabled: false,
        itemStyle: {
          fontSize: '12px'
        }
      },
      xAxis: {
        categories: uniqVisitorsDate,
      },
      yAxis: {
        gridLineWidth: 0,
        allowDecimals: false,
        title: {
          text: '',
        },
      },
      tooltip: {
        style: {
          fontSize: '12px'
        },  
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderWidth: 1,
        borderRadius: 5,
        padding: 8,
        shadow: true,
        shared: false,
        pointFormat:
          '<div style="text-align: center;"><span style="font-size: 16px; color: #FCA876;">{point.y}</span></div>',
        useHTML: true,
      },

      plotOptions: {
        spline: {
          marker: {
            enabled: true,
            radius: 4,
            lineColor: '#FCA876',
            lineWidth: 1,
          },
        },
      },

      series: [
        {
          name: '',
          data: uniqVisitorsCount,
          type: 'column',
        },
      ],

      responsive: {
        rules: [
          {
            condition: {
              maxWidth: 1,
            },
            chartOptions: {
              legend: {
                layout: 'horizontal',
                align: 'center',
                verticalAlign: 'bottom',
              },
            },
          },
        ],
      },
    };
  }
}
