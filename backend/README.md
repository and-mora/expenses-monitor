# Backend

## Installation requirements
The backend acts as a Resource Owner according to the OAuth2.0 protocol. It is responsible for managing the user's data and providing it to the frontend. The backend is written in Java and uses the Spring Boot framework. The database is a PostgreSQL instance.

The following docker secrets must be present:
- `DB_BACKEND_PASSWORD`

### API
Openapi page is accessible [here](https://expmonitor.freeddns.org/swagger-ui.html) (broken)

#### (Deprecated!!) Login with session cookie till v0.13.6
The following docker secrets must be present:
- `BASIC_AUTH_USERNAME`
- `BASIC_AUTH_PASSWORD`

To login run:
```
curl --location 'https://api.expmonitor.freeddns.org/login' \
--header 'Content-Type: application/x-www-form-urlencoded' \
--data-urlencode 'username=user' \
--data-urlencode 'password=pwd'
```
The response contains a `SESSION` cookie
```
Set-Cookie: "SESSION=session-cookie; Path=/; Secure; HttpOnly; SameSite=Lax"
```
that must be used in every API call in order to be authenticated.

To logout run: 
```
curl --location --request POST 'https://api.expmonitor.freeddns.org/logout'
```

#### Login with Keycloak (or any external Authorization Server)
Use your credentials to get a valid **token** from the Authorization Server.

To access the protected resources run:
```
curl --location 'https://api.expmonitor.freeddns.org/api/wallets' \
--header 'Authorization: Bearer <insert your token here>' 
```


## Deploy k8s

```
kubectl create ns expenses-monitor
read -sp 'Enter username for database: ' DB_BACKEND_USERNAME
read -sp 'Enter password for database: ' DB_BACKEND_PASSWORD
kubectl create secret generic backend-db-credentials --from-literal=postgres-password=$DB_BACKEND_PASSWORD --from-literal=postgres-username=$DB_BACKEND_USERNAME -n expenses-monitor
kubectl create secret tls backend-tls --cert=path/to/tls.crt --key=path/to/tls.key -n expenses-monitor
kubectl create secret generic db-connection-string --from-literal=host=postgresql.default --from-literal=connection-string=r2dbc:postgresql://postgresql.default:5432/expenses-monitor -n expenses-monitor
kubectl create cm backend-config --from-literal=OTEL_SERVICE_NAME=backend-java --from-literal=OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector-opentelemetry-collector.monitoring.svc.cluster.local:4317 --from-literal=OTEL_EXPORTER_OTLP_PROTOCOL=grpc --from-literal=OTEL_LOGS_EXPORTER=otlp --from-literal=OTEL_METRICS_EXPORTER=otlp --from-literal=OTEL_TRACES_EXPORTER=otlp --from-literal=OTEL_TRACES_SAMPLER=always_on -n expenses-monitor
kubectl apply -f manifest.yaml
```