# Expenses Monitor
[![Trivy scan](https://github.com/and-mora/expenses-monitor/actions/workflows/trivy.yml/badge.svg?branch=master)](https://github.com/and-mora/expenses-monitor/actions/workflows/trivy.yml)
[![CodeQL Action](https://github.com/and-mora/expenses-monitor/actions/workflows/codeql_analysis.yml/badge.svg?branch=master)](https://github.com/and-mora/expenses-monitor/actions/workflows/codeql_analysis.yml)
[![Release and Deploy](https://github.com/and-mora/expenses-monitor/actions/workflows/release-deploy.yml/badge.svg?branch=master)](https://github.com/and-mora/expenses-monitor/actions/workflows/release-deploy.yml)

The idea is to make an application to monitor the personal finance.
The project is new and I will work on it on best effort.

I will experiment Gradle and Spring Webflux.

## Local deployment (with docker)
From the project root directory run:
```
docker compose up -d && docker compose -f grafana/docker-compose.yaml up -d
```
3 containers will be created: the postgresql database, the grafana server and the app itself.

> **Warning**
the database script initialization is work in progress
