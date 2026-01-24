# Expense Companion - Frontend

> Modern React-based frontend for Expenses Monitor application

[![CI/CD](https://github.com/your-org/expense-companion/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/your-org/expense-companion/actions)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## 📋 Overview

Expense Companion is a production-ready React application built with modern web technologies for managing personal finances. It features authentication via Keycloak, real-time data synchronization, and a beautiful UI built with shadcn/ui components.

## ✨ Features

- 🔐 **Secure Authentication** - Keycloak integration with automatic token refresh
- 📊 **Dashboard** - Real-time balance, spending charts, and transaction history
- 💰 **Payment Management** - Create, edit, and categorize transactions
- 🏦 **Multi-Wallet Support** - Manage multiple accounts and wallets
- 🏷️ **Tag System** - Flexible tagging for better organization
- 📱 **Responsive Design** - Works seamlessly on desktop and mobile
- 🎨 **Modern UI** - Built with Tailwind CSS and Radix UI components
- ⚡ **Fast** - Optimized builds with code splitting and caching
- 🧪 **Well Tested** - Comprehensive unit and integration tests
- 🐳 **Docker Ready** - Production-ready Docker configuration

## 🚀 Quick Start

### Prerequisites

- Node.js 20+ and npm
- Backend API running (see [backend-rust](../backend-rust))
- Keycloak instance configured

### Installation

```sh
# Clone the repository
git clone <YOUR_GIT_URL>
cd expense-companion

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local

# Edit .env.local with your configuration
# VITE_KEYCLOAK_URL=https://auth.expmonitor.freeddns.org
# VITE_API_BASE_URL=http://localhost:8080
```

### Development

```sh
# Start development server with hot reload
npm run dev

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run linter
npm run lint

# Generate test coverage
npm run test:coverage
```

The application will be available at `http://localhost:5173`

## 🏗️ Production Build

### Build Locally

```sh
# Build for production
npm run build

# Preview production build
npm run preview
```

### Docker Build

```sh
# Build Docker image
docker build -t expense-companion:latest \
  --build-arg VITE_KEYCLOAK_URL=https://auth.expmonitor.freeddns.org \
  --build-arg VITE_KEYCLOAK_REALM=expenses-monitor \
  --build-arg VITE_KEYCLOAK_CLIENT_ID=expenses-monitor-frontend \
  --build-arg VITE_API_BASE_URL=https://api.expmonitor.freeddns.org \
  .

# Run container
docker run -p 3000:80 expense-companion:latest
```

### Docker Compose

```sh
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## 🔧 Configuration

### Environment Variables

All configuration is done via environment variables:

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `VITE_KEYCLOAK_URL` | Keycloak server URL | `https://auth.expmonitor.freeddns.org` | Yes |
| `VITE_KEYCLOAK_REALM` | Keycloak realm | `expenses-monitor` | Yes |
| `VITE_KEYCLOAK_CLIENT_ID` | Keycloak client ID | `expenses-monitor-frontend` | Yes |
| `VITE_API_BASE_URL` | Backend API URL | `http://localhost:8080` | Yes |
| `VITE_USE_MOCK_DATA` | Use mock data (demo mode) | `false` | No |
| `VITE_SOURCEMAPS` | Enable source maps | `false` | No |

See [.env.example](.env.example) for complete configuration template.

## 🧪 Testing

```sh
# Run all tests
npm test

# Watch mode for development
npm run test:watch

# UI mode with Vitest UI
npm run test:ui

# Coverage report
npm run test:coverage
```

Current test coverage: **90+ tests** across components, utilities, and API integration.

## 📦 Project Structure

```
expense-companion/
├── src/
│   ├── components/         # React components
│   │   ├── auth/          # Authentication components
│   │   ├── dashboard/     # Dashboard widgets
│   │   ├── layout/        # Layout components
│   │   └── ui/            # shadcn/ui components
│   ├── config/            # Configuration files
│   ├── contexts/          # React contexts
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utilities and API client
│   ├── pages/             # Page components
│   ├── test/              # Test utilities and mocks
│   └── types/             # TypeScript types
├── public/                # Static assets
├── .github/               # GitHub Actions workflows
├── Dockerfile             # Production Docker image
├── docker-compose.yml     # Docker Compose configuration
├── k8s-deployment.yaml    # Kubernetes manifests
├── nginx.conf             # Nginx configuration
└── vite.config.ts         # Vite configuration
```

## 🚢 Deployment

### Kubernetes

```sh
# Apply manifests
kubectl apply -f k8s-deployment.yaml

# Check deployment status
kubectl rollout status deployment/expense-companion-frontend

# View logs
kubectl logs -f deployment/expense-companion-frontend
```

### CI/CD Pipeline

The project includes a GitHub Actions workflow that:

1. ✅ Runs tests and linting
2. 🏗️ Builds production bundle
3. 🐳 Builds and pushes Docker image
4. 🚀 Deploys to Kubernetes (when configured)

Workflow triggers on:
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`

## 🔒 Security

- **CSP Headers** - Content Security Policy configured in nginx
- **Security Headers** - X-Frame-Options, X-Content-Type-Options, etc.
- **Token Management** - Automatic token refresh before expiry
- **Error Boundary** - Graceful error handling
- **Input Validation** - Client-side validation for all forms

## 📊 Performance

- **Code Splitting** - Vendor chunks for optimal caching
- **Lazy Loading** - Components loaded on demand
- **Minification** - Production builds are fully optimized
- **Gzip Compression** - Enabled in nginx
- **Cache Strategy** - Static assets cached for 1 year

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Related Projects

- [Backend (Rust)](../backend-rust) - Rust-based API server
- [Backend (Java)](../backend) - Legacy Java backend
- [Infrastructure](../manifest) - Kubernetes manifests and configs

## 📞 Support

For issues and questions:
- Create an issue in GitHub
- Check existing documentation
- Contact the development team

---

Built with ❤️ using React, TypeScript, Vite, and shadcn/ui
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
