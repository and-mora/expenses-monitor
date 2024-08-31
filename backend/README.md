# Backend

## Installation requirements

The following docker secrets must be present:
- `BASIC_AUTH_USERNAME`
- `BASIC_AUTH_PASSWORD`
- `DB_BACKEND_PASSWORD`

### API
Openapi page is accessible [here](https://expmonitor.freeddns.org/swagger-ui.html)

#### Login
To login run:
```
curl --location 'https://expmonitor.freeddns.org:8443/login' \
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
curl --location --request POST 'https://expmonitor.freeddns.org:8443/logout'
```

## Deploy k8s

```
kubectl create ns expenses-monitor
read -sp 'Enter username for backend: ' BASIC_AUTH_USERNAME
read -sp 'Enter password for backend: ' BASIC_AUTH_PASSWORD
read -sp 'Enter username for database: ' DB_BACKEND_USERNAME
read -sp 'Enter password for database: ' DB_BACKEND_PASSWORD
kubectl create secret generic backend-db-credentials --from-literal=postgres-password=$DB_BACKEND_PASSWORD --from-literal=postgres-username=$DB_BACKEND_USERNAME -n expenses-monitor
kubectl create secret generic backend-user-credentials --from-literal=user-password=$BASIC_AUTH_PASSWORD --from-literal=user-username=$BASIC_AUTH_USERNAME -n expenses-monitor
kubectl create secret tls backend-tls --cert=path/to/tls.crt --key=path/to/tls.key -n expenses-monitor
kubectl apply -f manifest.yaml
```