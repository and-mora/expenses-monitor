#!/bin/sh

#### WARNING
#### this script must be executed only once and on new installation

if [ $# -ne 1 ]; then
  echo "Illegal number of parameters (1 mandatory, was $#)" >&1
  echo "usage: sh script.sh k8s_secret_name" >&1
  exit 2
fi

K8S_SECRET_NAME=$1

VIEWER_NAME=$(kubectl get secret -n monitoring "$K8S_SECRET_NAME" -o jsonpath='{.data.username}' | base64 -d)
VIEWER_EMAIL=$(kubectl get secret -n monitoring "$K8S_SECRET_NAME" -o jsonpath='{.data.email}' | base64 -d)
VIEWER_PASSWORD=$(kubectl get secret -n monitoring "$K8S_SECRET_NAME" -o jsonpath='{.data.password}' | base64 -d)
ADMIN_USER=$(kubectl get secret -n monitoring grafana-admin-credentials -o jsonpath='{.data.admin-user}' | base64 -d)
ADMIN_PASSWORD=$(kubectl get secret -n monitoring grafana-admin-credentials -o jsonpath='{.data.admin-password}' | base64 -d)

# 1. create new user
curl -X POST -H "Content-Type: application/json" --user "$ADMIN_USER:$ADMIN_PASSWORD" -d "{
  \"name\":\"$VIEWER_NAME\",
  \"email\":\"$VIEWER_EMAIL\",
  \"login\":\"$VIEWER_NAME\",
  \"password\":\"$VIEWER_PASSWORD\"
}" https://grafana.expmonitor.freeddns.org/api/admin/users

# 2. create new team
curl -X POST -H "Content-Type: application/json" --user "$ADMIN_USER:$ADMIN_PASSWORD" -d '{
  "name": "ViewerTeam"
}' https://grafana.expmonitor.freeddns.org/api/teams

# 3. associate user to team
curl -X POST -H "Content-Type: application/json" --user "$ADMIN_USER:$ADMIN_PASSWORD" -d '{
  "userId":2
}' https://grafana.expmonitor.freeddns.org/api/teams/1/members
