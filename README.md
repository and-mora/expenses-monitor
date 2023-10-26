# Expenses Monitor
![Release](https://img.shields.io/github/v/release/and-mora/expenses-monitor?label=grafana-release&sort=semver&filter=*-grafana)
![Release](https://img.shields.io/github/v/release/and-mora/expenses-monitor?label=backend-release&sort=semver&filter=*-backend&color=blue)
![Release](https://img.shields.io/github/v/release/and-mora/expenses-monitor?label=client-release&sort=semver&filter=*-client)
![Release](https://img.shields.io/github/v/release/and-mora/expenses-monitor?label=frontend-release&sort=semver&filter=*-frontend&color=red)

[![Trivy scan](https://github.com/and-mora/expenses-monitor/actions/workflows/trivy.yml/badge.svg?branch=master)](https://github.com/and-mora/expenses-monitor/actions/workflows/trivy.yml)
[![Release and Deploy](https://github.com/and-mora/expenses-monitor/actions/workflows/cd-pipeline.yml/badge.svg)](https://github.com/and-mora/expenses-monitor/actions/workflows/cd-pipeline.yml)

### Goal
The idea is to make an application to monitor the personal finance.
I will work on it on best effort.

### Stack
![Grafana](https://img.shields.io/badge/grafana-%23F46800.svg?style=for-the-badge&logo=grafana&logoColor=white)
![Svelte](https://img.shields.io/badge/Svelte-4A4A55?style=for-the-badge&logo=svelte&logoColor=FF3E00)
![Spring](https://img.shields.io/badge/spring-%236DB33F.svg?style=for-the-badge&logo=spring&logoColor=white)
![Postgres](https://img.shields.io/badge/postgres-%23316192.svg?style=for-the-badge&logo=postgresql&logoColor=white)

I will experiment Gradle, Spring Webflux.

It's a monorepo containing all the components involved in the application:
- Grafana server for dashboarding
- Backend server in Spring Boot
- Frontend in Svelte
- Postgresql database

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
- grafana server, see [here](grafana/README.md)
- backend, see [here](backend/README.md)

> **Work In Progress**


