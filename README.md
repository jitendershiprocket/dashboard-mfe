# Dashboard MFE

Modern Angular 20 dashboard micro-frontend with intelligent API caching, lazy loading, and optimized for S3 deployment as a custom element.

## 🚀 **Highly Optimized Build**
- ✅ **168 KB gzipped** initial load (82% smaller than before)
- ✅ **Lazy loading** - All tabs load on demand
- ✅ **70% compression** - Gzip optimized
- ✅ **S3-ready** - Deploy as custom element
- ✅ **Production tested** - Ready for SR_Web integration

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
npm run build:prod

# S3-optimized build (recommended)
npm run build:s3

# Analyze bundle size
npm run analyze

# Run unit tests
npm test

# Watch mode
npm run watch
```

## 📊 Build Results

**Current Production Build:**
- Initial Load: 168 KB (gzipped) - Down from 920 KB
- Lazy Chunks: 8 separate chunks, loaded on demand
- Total Size: 275 KB (gzipped, all chunks combined)
- Compression: 70% (926 KB → 275 KB)

See `OPTIMIZATION_RESULTS.md` for detailed metrics.

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
# Standard production build
npm run build:prod

# S3-optimized build (creates gzipped files, integration snippet, manifest)
npm run build:s3

# Build artifacts will be in dist/optimized/
```

Build optimizations:
- ✅ Lazy loading for all tab components (60-70% initial size reduction)
- ✅ Selective Chart.js registration (100-150 KB saved)
- ✅ Tree-shaking and dead code elimination
- ✅ AOT compilation with aggressive optimization
- ✅ Minification and bundling
- ✅ Gzip compression (70% reduction)
- ✅ No output hashing (easier S3 integration)

## 🌐 S3 Deployment

After running `npm run build:s3`, upload to S3:

```bash
aws s3 sync dist/optimized/ s3://your-bucket/dashboard-mfe/ \
  --exclude "*.gz" \
  --cache-control "max-age=31536000" \
  --acl public-read
```

See `OPTIMIZATION_GUIDE.md` for detailed deployment instructions.

## 🔧 Integration with SR_Web

The optimized build is ready to integrate as a custom element:

```html
<!-- Load in SR_Web -->
<link rel="stylesheet" href="https://your-cdn.s3.amazonaws.com/dashboard-mfe/styles.css">
<script src="https://your-cdn.s3.amazonaws.com/dashboard-mfe/polyfills.js" defer></script>
<script src="https://your-cdn.s3.amazonaws.com/dashboard-mfe/main.js" defer></script>

<!-- Use the custom element -->
<dashboard-mfe-root></dashboard-mfe-root>
```

See `SR_WEB_INTEGRATION.md` for complete integration guide.

## 📚 Documentation

- **[OPTIMIZATION_RESULTS.md](./OPTIMIZATION_RESULTS.md)**: **NEW!** Complete optimization results
  - Before/After comparison
  - Build size breakdown
  - Performance metrics
  - Success criteria
  
- **[OPTIMIZATION_GUIDE.md](./OPTIMIZATION_GUIDE.md)**: **NEW!** Optimization techniques guide
  - Lazy loading implementation
  - Chart.js optimization
  - Angular build config
  - S3 deployment guide
  
- **[SR_WEB_INTEGRATION.md](./SR_WEB_INTEGRATION.md)**: **NEW!** Integration guide for SR_Web
  - Step-by-step integration
  - Code examples
  - Troubleshooting
  - Testing instructions

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
