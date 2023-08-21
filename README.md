# Expenses Monitor

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