import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-ndr',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ndr.html',
  styleUrl: './ndr.css'
})
export class NdrComponent {
  title = 'NDR';
}
