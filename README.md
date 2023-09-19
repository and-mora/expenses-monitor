# Expenses Monitor
![Release](https://img.shields.io/github/v/release/and-mora/expenses-monitor?label=grafana-release&sort=semver&filter=*-grafana)
![Release](https://img.shields.io/github/v/release/and-mora/expenses-monitor?label=backend-release&sort=semver&filter=*-backend&color=blue)
![Release](https://img.shields.io/github/v/release/and-mora/expenses-monitor?label=client-release&sort=semver&filter=*-client)

[![Trivy scan](https://github.com/and-mora/expenses-monitor/actions/workflows/trivy.yml/badge.svg?branch=master)](https://github.com/and-mora/expenses-monitor/actions/workflows/trivy.yml)
[![Release and Deploy](https://github.com/and-mora/expenses-monitor/actions/workflows/cd-pipeline.yml/badge.svg)](https://github.com/and-mora/expenses-monitor/actions/workflows/cd-pipeline.yml)

![Grafana](https://img.shields.io/badge/grafana-%23F46800.svg?style=for-the-badge&logo=grafana&logoColor=white)
![Spring](https://img.shields.io/badge/spring-%236DB33F.svg?style=for-the-badge&logo=spring&logoColor=white)
![Postgres](https://img.shields.io/badge/postgres-%23316192.svg?style=for-the-badge&logo=postgresql&logoColor=white)

### Goal
The idea is to make an application to monitor the personal finance.
I will work on it on best effort.

### Stack
I will experiment Gradle, Spring Webflux.

It's a monorepo containing all the components involved in the application:
- Grafana server for dashboarding
- Backend server in Spring Boot
- Client **TBD**
- Postgresql database

### Devops
The main pipeline is located in `.github/workflows/cd-pipeline.yml` and does the following:
- identify which module (by directory) has changes and find the new version tag according to semantic versioning (each module has a different suffix)
- create tag and GitHub Release
- build the image and deploy

### Security
OAuth2.0 is gonna be implemented soon... stay tuned!

## Local deployment (with docker)
From the project root directory run:
```
docker compose -f backend/docker-compose.yml up -d && docker compose -f grafana/docker-compose.yaml up -d
```
3 containers will be created: the postgresql database, the grafana server and the app itself.

> **Warning**
the database script initialization is work in progress
