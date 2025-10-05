import 'zone.js';
import { createApplication } from '@angular/platform-browser';
import { createCustomElement } from '@angular/elements';
import { appConfig } from './app/app.config';
import { DashboardComponent } from './app/dashboard/dashboard';

console.log('🚀 Starting Dashboard MFE Web Component initialization...');

// Create the Angular application
createApplication(appConfig).then((appRef) => {
  console.log('✅ Angular application created successfully');
  
  // Create the custom element
  const dashboardElement = createCustomElement(DashboardComponent, { injector: appRef.injector });
  console.log('✅ Custom element created successfully');
  
  // Define the custom element
  customElements.define('dashboard-mfe-root', dashboardElement);
  console.log('✅ Dashboard MFE Web Component registered successfully!');
  
  // Dispatch a custom event to notify that the component is ready
  window.dispatchEvent(new CustomEvent('dashboard-mfe-ready'));
}).catch((err) => {
  console.error('❌ Failed to create Dashboard MFE Web Component:', err);
  console.error('Error details:', err);
});
