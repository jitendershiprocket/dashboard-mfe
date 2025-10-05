import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ToastrService {
  error(message: string) {
    // Implement actual toast notification
    console.error('Error:', message);
    
    // Example: Show toast notification
    // this.toastr.error(message);
  }

  success(message: string) {
    // Implement actual toast notification
    console.log('Success:', message);
    
    // Example: Show toast notification
    // this.toastr.success(message);
  }

  info(message: string) {
    // Implement actual toast notification
    console.info('Info:', message);
    
    // Example: Show toast notification
    // this.toastr.info(message);
  }
}
