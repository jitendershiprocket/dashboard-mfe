import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-whatsapp',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './whatsapp.html',
  styleUrl: './whatsapp.css'
})
export class WhatsappComponent {
  title = 'WhatsApp Communication';
}
