# Grafana
Create a grafana-oss (open source version) server.

## Local deployment with Docker Swarm
```
git clone https://github.com/and-mora/expenses-monitor.git
cd expenses-monitor/grafana/
docker stack deploy --compose-file docker-compose.yml grafana
```

## Remote deployment on Virtual Machine
### Prerequisites

The `.github/workflows/deploy-grafana.yml` action provides to deploy the grafana server on your VM.
It's required to set the following secrets on the **repository**:
- `VM_HOST`
- `VM_PORT`
- `VM_USERNAME`
- `VM_PRIVATE_KEY`

#### Database credentials
Add the docker secret relative to database password:

- default username (see [here](https://github.com/and-mora/expenses-monitor/blob/ad0cbe5ec477d3ba24bc06722fe659d0a32b47e2/database/init-system-users.sql#L24)): `grafana_user`
- add password secret to docker swarm
    ```
    read -sp 'Enter password: ' PASS
    echo $PASS | docker secret create DB_GRAFANA_PASSWORD -
    ```

#### TLS certificate
Grafana expects to have certificate and private key in `/etc/letsencrypt/live/*` directory. 

Customize the [docker-compose](docker-compose.yml) if you have it in another directory.

Official grafana documentation [here](https://grafana.com/docs/grafana/latest/setup-grafana/set-up-https/)

**Important!** Ensure the correct permission on the files to be used by Grafana. In case of docker you can use the 472 user id (it's the one used by grafana) to grant the correct permission.
```
sudo chown 472:472 /etc/letsencrypt/*
sudo chmod -R g+rx /etc/letsencrypt/*
```

#### Notification settings

To configure a Gmail account as SMTP server read the following: https://community.grafana.com/t/setup-smtp-with-gmail/85815 and https://support.google.com/accounts/answer/185833?hl=en

You need to add the app password in the following **secret** in docker environment:
- `GMAIL_PASSWORD`

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