import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-rto',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './rto.html',
  styleUrl: './rto.css'
})
export class RtoComponent {
  title = 'RTO';
}
