import 'zone.js';
import { createApplication } from '@angular/platform-browser';
import { createCustomElement } from '@angular/elements';
import { appConfig } from './app/app.config';
import { DashboardComponent } from './app/dashboard/dashboard';

/**
 * Dashboard MFE - Custom Element Bootstrap
 * 
 * Optimized for:
 * - Web Component usage
 * - S3 deployment
 * - Integration in SR_Web and other apps
 * - Minimal bundle size with lazy loading
 */

// Check if already initialized
if (customElements.get('dashboard-mfe-root')) {
  console.warn('⚠️ Dashboard MFE already initialized');
} else {
  console.log('🚀 Starting Dashboard MFE Web Component initialization...');

  // Create the Angular application with optimized config
  createApplication(appConfig).then((appRef) => {
    console.log('✅ Angular application created successfully');
    
    // Create the custom element
    const dashboardElement = createCustomElement(DashboardComponent, { 
      injector: appRef.injector 
    });
    console.log('✅ Custom element created successfully');
    
    // Define the custom element
    customElements.define('dashboard-mfe-root', dashboardElement);
    console.log('✅ Dashboard MFE Web Component registered successfully!');
    
    // Dispatch ready event with metadata
    window.dispatchEvent(new CustomEvent('dashboard-mfe-ready', {
      detail: {
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        features: ['lazy-loading', 'api-caching', 'onpush-detection']
      }
    }));
    
    console.log('📦 Dashboard MFE ready for use!');
  }).catch((err) => {
    console.error('❌ Failed to create Dashboard MFE Web Component:', err);
    console.error('Error details:', err);
    
    // Dispatch error event
    window.dispatchEvent(new CustomEvent('dashboard-mfe-error', {
      detail: { error: err.message }
    }));
  });
}

// Expose global API for host applications
(window as any).DashboardMFE = {
  version: '1.0.0',
  isReady: () => customElements.get('dashboard-mfe-root') !== undefined,
  reload: () => {
    const elements = document.querySelectorAll('dashboard-mfe-root');
    elements.forEach(el => {
      el.dispatchEvent(new CustomEvent('reload'));
    });
  }
};
