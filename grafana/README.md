# Grafana
Create a grafana-oss (open source version) server.

## Local deployment with Docker Swarm
```
git clone https://github.com/and-mora/expenses-monitor.git
cd expenses-monitor/grafana/
docker stack deploy --compose-file docker-compose.yml grafana
```

## Remote deployment on Virtual Machine
The `.github/workflows/deploy-grafana.yml` action provides to deploy the grafana server on your VM.
It's required to set the following secrets on the repository:
- `VM_HOST`
- `VM_PORT`
- `VM_USERNAME`
- `VM_PRIVATE_KEY`

## Configuration
The script `init.sh` will create one user with view only permission and change the admin password from the default one. 
It must be executed only on new installation.

- Run the init script with the command 
```
sh init.sh <VIEWER_NAME> <VIEWER_EMAIL> <VIEWER_PASSWORD> <ADMIN_PASSWORD>
```

Log in the viewer-only account with the credentials: `VIEWER_EMAIL` - `VIEWER_PASSWORD`.

Log in the admin account with the credentials: `admin` - `ADMIN_PASSWORD`.

## Uninstall
```
docker stack rm grafana
docker volume rm grafana_storage
```

### Alternative commands for Docker (non Swarm)
```
docker compose up -d
docker compose down
```