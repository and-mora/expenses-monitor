# Database

The database involved in the Expenses monitor application is a PostgreSQL self hosted on a docker swarm inside a VM.

## Installation in Docker Swarm

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
### Deploy
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

## Installation in K8s

- move to workdir
```
cd k8s
```
- create postgres master password and related k8s secret
```
read -sp 'Enter password: ' PASS_POSTGRES
kubectl create secret generic postgresql --from-literal=postgres-password=$PASS_POSTGRES
read -sp 'Enter grafana user password: ' PASS_USER_GRAFANA
read -sp 'Enter backend user password: ' PASS_USER_BACKEND
kubectl create secret generic postgresql --from-literal=postgres-password=$PASS_POSTGRES
sed -i 's/$PASS_USER_GRAFANA/'"$PASS_USER_GRAFANA"'/' init-system-users.sql
sed -i 's/$PASS_USER_BACKEND/'"$PASS_USER_BACKEND"'/' init-system-users.sql
kubectl create secret generic postgresql-init-user-script --from-file=script=init-system-users.sql
```
- install chart
```
helm install postgresql charts/* -f values.yaml
```
