# Grafana
Create a grafana-oss (open source version) server.

## Configuration
The script `init.sh` will create one user with view only permission and change the admin password from the default one.

- Customize the file `sample_env.sh` to provide the data needed.
- Give execution permission `chmod +x sample_env.sh`
- Run the init script with the command sh `init.sh sample_env.sh`

Log in the viewer-only account with the credentials: `VIEWER_EMAIL` - `VIEWER_PASSWORD`.

Log in the admin account with the credentials: `admin` - `ADMIN_PASSWORD`
