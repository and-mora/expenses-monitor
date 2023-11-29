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