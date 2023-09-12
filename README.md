# Expenses Monitor
![Release](https://img.shields.io/github/v/release/and-mora/expenses-monitor?label=grafana-release&sort=semver&filter=*-grafana)
![Release](https://img.shields.io/github/v/release/and-mora/expenses-monitor?label=backend-release&sort=semver&filter=v*.*.*&color=blue)
[![Trivy scan](https://github.com/and-mora/expenses-monitor/actions/workflows/trivy.yml/badge.svg?branch=master)](https://github.com/and-mora/expenses-monitor/actions/workflows/trivy.yml)
[![Release and Deploy](https://github.com/and-mora/expenses-monitor/actions/workflows/cd-pipeline.yml/badge.svg)](https://github.com/and-mora/expenses-monitor/actions/workflows/cd-pipeline.yml)

![Spring](https://img.shields.io/badge/spring-%236DB33F.svg?style=for-the-badge&logo=spring&logoColor=white)
![Postgres](https://img.shields.io/badge/postgres-%23316192.svg?style=for-the-badge&logo=postgresql&logoColor=white)


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
