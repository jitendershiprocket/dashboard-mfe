import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-delays',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './delays.html',
  styleUrl: './delays.css'
})
export class DelaysComponent {
  title = 'Delays';
}
