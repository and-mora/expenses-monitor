#!/bin/sh

#### WARNING
#### this script must be executed only once and on new installation

if [ $# -ne 1 ]; then
  echo "Illegal number of parameters (1 mandatory, was $#)" >&1
  echo "usage: sh script.sh environment_file" >&1
  exit 2
fi

ENV_FILE=$1

# load the env variables
./"$ENV_FILE"

# 1. create new user
curl -X POST -H "Content-Type: application/json" -d "{
  \"name\":\"$VIEWER_NAME\",
  \"email\":\"$VIEWER_EMAIL\",
  \"login\":\"$VIEWER_NAME\",
  \"password\":\"$VIEWER_PASSWORD\"
}" https://admin:admin@expmonitor.freeddns.org:3000/api/admin/users

#curl  https://admin:admin@expmonitor.freeddns.org:3000/api/users/2 | jq

# 2. create new team
curl -X POST -H "Content-Type: application/json" -d '{
  "name": "ViewerTeam"
}' https://admin:admin@expmonitor.freeddns.org:3000/api/teams

#curl  https://admin:admin@expmonitor.freeddns.org:3000/api/teams/1 | jq

# 3. associate user to team
curl -X POST -H "Content-Type: application/json" -d '{
  "userId":2
}' https://admin:admin@expmonitor.freeddns.org:3000/api/teams/1/members

# 4. change admin password
curl -X PUT -H "Content-Type: application/json" -d "{
  \"oldPassword\": \"admin\",
  \"newPassword\": \"$ADMIN_PASSWORD\",
  \"confirmNew\": \"$ADMIN_PASSWORD\"
}" https://admin:admin@expmonitor.freeddns.org:3000/api/user/password
