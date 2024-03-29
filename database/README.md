# Database

The database involved in the Expenses monitor application is a PostgreSQL self hosted on a docker swarm inside a VM.

## Installation
It's possible to deploy the db with `docker-compose.yml` file provided.
It creates a persistent volume to prevent data loss.

### Secret
The docker-compose requires a secret named `POSTGRES_PASSWORD` as root password.
The secret needs to be created in the Docker Swarm environment:
```
printf "my root password" | docker secret create POSTGRES_PASSWORD -
```
(safer) If you want to avoid the password logged in bash history you can run:
```
read -sp 'Enter password: ' PASS
echo $PASS | docker secret create POSTGRES_PASSWORD -
```
### Deploy in Docker Swarm
To deploy run: 
```
docker stack deploy --compose-file docker-compose.yml database
```

## Configuration
There are three files:
1. `schema.sql` creates the basic schema needed by the application
2. `init-system-users.sql` creates roles and system users needed by various component of the application. You need to customize the user passwords inside the file.
3. `init.sh` execute the two sql files in the postgres. 

Download the users file:
```
wget https://raw.githubusercontent.com/and-mora/expenses-monitor/master/database/init-system-users.sql
```
and customize it.

Run the `init.sh`.

The user passwords must be created in the Docker Swarm to let the other components (Grafana and Backend) to access them.
The backend needs the secret:
- `DB_BACKEND_PASSWORD`

Grafana needs:
- `DB_GRAFANA_PASSWORD`