# Expenses Monitor

[![Release](https://img.shields.io/github/v/release/and-mora/expenses-monitor?label=monitoring-stack-release&sort=semver&filter=*-monitoring)](https://github.com/and-mora/expenses-monitor/releases)
[![Release](https://img.shields.io/github/v/release/and-mora/expenses-monitor?label=backend-release&sort=semver&filter=*-backend&color=blue)](https://github.com/and-mora/expenses-monitor/releases)
[![Release](https://img.shields.io/github/v/release/and-mora/expenses-monitor?label=expense-companion-release&sort=semver&filter=*-expense-companion&color=green)](https://github.com/and-mora/expenses-monitor/releases)

[![Trivy scan](https://github.com/and-mora/expenses-monitor/actions/workflows/trivy.yml/badge.svg?branch=master)](https://github.com/and-mora/expenses-monitor/actions/workflows/trivy.yml)
[![Build backend](https://github.com/and-mora/expenses-monitor/actions/workflows/build-be.yml/badge.svg)](https://github.com/and-mora/expenses-monitor/actions/workflows/build-be.yml)
[![Release and Deploy](https://github.com/and-mora/expenses-monitor/actions/workflows/cd-pipeline.yml/badge.svg)](https://github.com/and-mora/expenses-monitor/actions/workflows/cd-pipeline.yml)

A modern, full-stack personal finance tracking application built with cutting-edge technologies. Monitor your expenses, manage wallets, and gain insights into your financial habits with real-time dashboards and observability.

## ✨ Features

- **Expense Tracking**: Log and categorize payments with tags and categories
- **Wallet Management**: Organize finances across multiple wallets
- **Real-time Dashboards**: Visualize spending patterns with Grafana
- **Secure Authentication**: OAuth2 integration with Keycloak
- **Full Observability**: Prometheus metrics, Loki logs, Tempo traces
- **GitOps Deployment**: Automated CI/CD with ArgoCD on Kubernetes
- **API-First Design**: RESTful API with OpenAPI specification

## 🏗️ Architecture

This monorepo contains all components of the expenses monitor application:

- **Frontend**: Modern React application with Vite (expense-companion)
- **Backend**: High-performance Rust API server (backend-rust), with legacy Java Spring Boot being phased out
- **Database**: PostgreSQL with schema `expenses`
- **Observability Stack**: Prometheus, Grafana, Loki, Tempo, OpenTelemetry collector
- **Infrastructure**: Kubernetes manifests with ArgoCD GitOps

![Architecture Diagram](docs/img/expenses-monitor-schema.png)

## 🛠️ Tech Stack

### Frontend
![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)

### Backend
![Rust](https://img.shields.io/badge/rust-%23000000.svg?style=for-the-badge&logo=rust&logoColor=white)
![Actix Web](https://img.shields.io/badge/Actix%20Web-%23000000.svg?style=for-the-badge&logo=rust&logoColor=white)

### Database & Infrastructure
![PostgreSQL](https://img.shields.io/badge/postgresql-%23316192.svg?style=for-the-badge&logo=postgresql&logoColor=white)
![Kubernetes](https://img.shields.io/badge/kubernetes-%23326ce5.svg?style=for-the-badge&logo=kubernetes&logoColor=white)
![ArgoCD](https://img.shields.io/badge/ArgoCD-%23EF7B4D.svg?style=for-the-badge&logo=argo&logoColor=white)

### Observability
![Prometheus](https://img.shields.io/badge/Prometheus-E6522C?style=for-the-badge&logo=Prometheus&logoColor=white)
![Grafana](https://img.shields.io/badge/grafana-%23F46800.svg?style=for-the-badge&logo=grafana&logoColor=white)
![Loki](https://img.shields.io/badge/Loki-%23F46800?style=for-the-badge&logo=grafana&logoColor=white)
![Tempo](https://img.shields.io/badge/Tempo-%23F46800?style=for-the-badge&logo=grafana&logoColor=white)
![OpenTelemetry](https://img.shields.io/badge/OpenTelemetry-FFFFFF?&style=for-the-badge&logo=opentelemetry&logoColor=black)

### Security
![Keycloak](https://img.shields.io/badge/Keycloak-%23F46800.svg?style=for-the-badge&logo=keycloak&logoColor=white)

## 🚀 Getting Started

### Prerequisites
- Docker & Docker Compose
- Rust (for backend development)
- Node.js & npm (for frontend development)
- kubectl & helm (for Kubernetes deployment)

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/and-mora/expenses-monitor.git
   cd expenses-monitor
   ```

2. **Start the database**
   ```bash
   cd database
   docker-compose up -d
   ```

3. **Run the backend**
   ```bash
   cd backend-rust
   cargo run
   ```

4. **Run the frontend**
   ```bash
   cd expense-companion
   npm install
   npm run dev
   ```

5. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8080
   - Grafana: http://localhost:3000

### Testing
```bash
# Backend tests
cd backend-rust
cargo test

# Frontend tests
cd expense-companion
npm test
```

## 📦 Deployment

The application is deployed using GitOps with ArgoCD on Kubernetes:

1. Push changes to master
2. CI pipeline builds and tags releases
3. ArgoCD automatically deploys to staging/production

See [manifest/](manifest/) for Kubernetes manifests and [docs/](docs/) for detailed deployment guides.

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes with tests
4. Submit a pull request

See [docs/](docs/) for development guidelines and API documentation.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

*Built with ❤️ for personal finance management*


