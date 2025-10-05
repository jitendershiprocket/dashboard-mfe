import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-courier',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './courier.html',
  styleUrl: './courier.css'
})
export class CourierComponent {
  title = 'Courier';
}
