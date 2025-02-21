# Expenses Monitor
![Release](https://img.shields.io/github/v/release/and-mora/expenses-monitor?label=monitoring-stack-release&sort=semver&filter=*-monitoring)
![Release](https://img.shields.io/github/v/release/and-mora/expenses-monitor?label=backend-release&sort=semver&filter=*-backend&color=blue)
![Release](https://img.shields.io/github/v/release/and-mora/expenses-monitor?label=frontend-release&sort=semver&filter=*-frontend&color=red)

[![Trivy scan](https://github.com/and-mora/expenses-monitor/actions/workflows/trivy.yml/badge.svg?branch=master)](https://github.com/and-mora/expenses-monitor/actions/workflows/trivy.yml)
[![Build backend](https://github.com/and-mora/expenses-monitor/actions/workflows/build-be.yml/badge.svg)](https://github.com/and-mora/expenses-monitor/actions/workflows/build-be.yml)
[![Release and Deploy](https://github.com/and-mora/expenses-monitor/actions/workflows/cd-pipeline.yml/badge.svg)](https://github.com/and-mora/expenses-monitor/actions/workflows/cd-pipeline.yml)

### Goal
The idea is to make an application to monitor the personal finance.
I will work on it on best effort.

### Stack
![Angular](https://img.shields.io/badge/Angular-DD0031?style=for-the-badge&logo=angular&logoColor=white)
![Spring](https://img.shields.io/badge/spring-%236DB33F.svg?style=for-the-badge&logo=spring&logoColor=white)
![Postgres](https://img.shields.io/badge/postgres-%23316192.svg?style=for-the-badge&logo=postgresql&logoColor=white)

![Prometheus](https://img.shields.io/badge/Prometheus-E6522C?style=for-the-badge&logo=Prometheus&logoColor=white)
![OpenTelemetry](https://img.shields.io/badge/OpenTelemetry-FFFFFF?&style=for-the-badge&logo=opentelemetry&logoColor=black)
![Grafana](https://img.shields.io/badge/grafana-%23F46800.svg?style=for-the-badge&logo=grafana&logoColor=white)
![Loki](https://img.shields.io/badge/Loki-%23F46800?style=for-the-badge&logo=grafana&logoColor=white)
![Tempo](https://img.shields.io/badge/Tempo-%23F46800?style=for-the-badge&logo=grafana&logoColor=white)

![Kubernetes](https://img.shields.io/badge/kubernetes-%23326ce5.svg?style=for-the-badge&logo=kubernetes&logoColor=white)


I will experiment Gradle, Spring Webflux.

It's a monorepo containing all the components involved in the application:
- Grafana server for dashboards and alerting
- Backend server in Spring Boot
- Frontend in Angular (overkill of course, but the most known and with materialUI)
- Postgresql database
- Prometheus for monitoring backend
- Microk8s (started with Docker Swarm and upgraded later)

![expenses-monitor-schema.png](docs/img/expenses-monitor-schema.png)

### Devops
The main pipeline is located in `.github/workflows/cd-pipeline.yml` and does the following:
- identify which module (by directory) has changes and find the new version tag according to semantic versioning (each module has a different suffix)
- create tag and GitHub Release
- build the image and deploy

### Security
Form login with session token.

#### Future improvements
- OAuth2.0

## Local deployment (with Docker Swarm)

### Prerequisites
1. Init the swarm if you haven't already:
    ```
    docker swarm init
    ```
2. Create the docker network used by every service:
    ```
    docker network create -d overlay expenses_monitor
    ```
3. Get a TLS certificate, follow [here](docs/tls_certificate.md) if you don't have one.

### Deploy
- the database, see [here](database/README.md)
- grafana server, see [here](monitoring/README.md)
- backend, see [here](backend/README.md)

> **Work In Progress**


