import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  trackEvent(event: string, data: any) {
    // Implement actual analytics tracking
    console.log('Analytics Event:', event, data);
    
    // Example: Send to Google Analytics, PostHog, etc.
    // gtag('event', event, data);
  }
}
