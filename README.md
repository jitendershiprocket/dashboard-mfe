# Dashboard MFE

Modern Angular 20 dashboard micro-frontend with intelligent API caching, OnPush change detection, and responsive design.

## 🚀 Features

- ✅ **Multi-Tab Dashboard**: Overview, Orders, Shipments, NDR, WhatsApp, RTO, Courier, Delays
- ✅ **Intelligent API Caching**: Reduces redundant API calls by 30-80%
- ✅ **Angular 20**: Standalone components with signals and modern APIs
- ✅ **Optimized Performance**: OnPush change detection strategy
- ✅ **Data Visualization**: Chart.js integration for graphs and charts
- ✅ **HTTP Interceptors**: Automatic retry, auth tokens, error handling
- ✅ **Tailwind CSS**: Modern, responsive styling
- ✅ **Type-Safe**: Full TypeScript support

## 📦 Tech Stack

- **Angular**: 20.3.0
- **Chart.js**: 4.5.0 (via ng2-charts)
- **Tailwind CSS**: 3.4.18
- **Moment.js**: Date manipulation
- **RxJS**: Reactive programming
- **TypeScript**: 5.9.2

## 🛠️ Installation

```bash
# Clone the repository
git clone <repository-url>
cd dashboard-mfe

# Install dependencies
npm install

# Start development server
npm start
```

Navigate to `http://localhost:4200/`

## 📝 Quick Commands

```bash
# Development server
npm start

# Production build
npm run build

# Run unit tests
npm test

# Watch mode
npm run watch
```

## 📂 Project Structure

```
src/app/
├── dashboard/          # Main dashboard container
├── overview/           # Overview tab
├── orders/             # Orders tab
├── shipments/          # Shipments tab
├── ndr/                # NDR tab
├── whatsapp/           # WhatsApp communication tab
├── rto/                # RTO (Return to Origin) tab
├── courier/            # Courier analytics tab
├── delays/             # Delays tracking tab
├── services/           # HTTP and cache services
│   ├── http-service.service.ts
│   └── api-cache.service.ts
├── interceptors/       # HTTP interceptors
└── shared/             # Shared components and utilities
```

## 🎯 API Caching

The dashboard implements intelligent API response caching:

- **Cache Duration**: 5 minutes (configurable)
- **Storage**: In-memory (clears on page refresh)
- **Benefits**: 30-80% reduction in redundant API calls

### Usage

```typescript
// Automatic caching (default)
this.http.get('endpoint').subscribe(res => {
  // First call: Makes API request
  // Subsequent calls: Returns cached data
});

// Bypass cache for fresh data
this.http.get('endpoint', {}, 'json', false).subscribe(res => {
  // Always makes fresh API call
});

// Clear cache manually
this.http.clearCache();
```

See [DOCUMENTATION.md](./DOCUMENTATION.md) for complete API caching guide.

## ⚙️ Configuration

### Environment

Edit `src/environment.ts`:

```typescript
export const environment = {
  production: false,
  apiPath: 'https://apiv2.shiprocket.in/v1/external/',
  // ... other configs
};
```

### Cache TTL

Edit `src/app/services/api-cache.service.ts`:

```typescript
private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
```

## 🧪 Testing

```bash
# Run unit tests
npm test

# Run tests in watch mode
npm test -- --watch

# Generate coverage report
npm test -- --code-coverage
```

## 🏗️ Building for Production

```bash
# Production build
npm run build

# Build artifacts will be in dist/
```

Build optimizations:
- Tree-shaking and dead code elimination
- AOT compilation
- Minification and bundling
- Lazy loading support

## 📚 Documentation

- **[DOCUMENTATION.md](./DOCUMENTATION.md)**: Complete project documentation
  - API Caching System
  - Angular 20 Optimizations
  - Performance Tips
  - Advanced Configuration

## 🔧 Development Guidelines

### Creating New Components

```bash
# Generate standalone component
ng generate component new-component --standalone
```

### Code Style

- Use OnPush change detection
- Prefer signals over traditional state
- Use trackBy in *ngFor
- Implement proper TypeScript types
- Follow Angular style guide

### Performance Best Practices

1. Use `ChangeDetectionStrategy.OnPush`
2. Leverage signals for reactive state
3. Use API caching for read operations
4. Implement trackBy functions
5. Lazy load routes when possible

## 🐛 Troubleshooting

### Cache Not Working
- Check console logs for "Cache HIT/MISS"
- Verify `useCache` parameter
- Check if cache TTL expired

### API Errors
- Check Network tab in DevTools
- Verify authentication token
- Check interceptor error logs

### Chart Not Rendering
- Verify Chart.js registration
- Check data format
- Use `setTimeout()` for OnPush components

## 📄 License

Proprietary - All rights reserved

## 👥 Support

For issues or questions, contact the development team.

---

**Version**: 1.0.0  
**Angular**: 20.3.0  
**Last Updated**: October 2025
