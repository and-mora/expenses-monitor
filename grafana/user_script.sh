#!/bin/sh

# TODO parametrize the script

# 1. create new user
curl -X POST -H "Content-Type: application/json" -d '{
  "name":"Andrea",
  "email":"and.morabito@gmail.com",
  "login":"andrea",
  "password":"andrea",
  "theme":"dark"
}' http://admin:admin@localhost:3000/api/admin/users

#curl  http://admin:admin@localhost:3000/api/users/2 | jq

# 2. create new team
curl -X POST -H "Content-Type: application/json" -d '{
  "name": "ViewerTeam"
}' http://admin:admin@localhost:3000/api/teams

#curl  http://admin:admin@localhost:3000/api/teams/1 | jq

# 3. associate user to team
curl -X POST -H "Content-Type: application/json" -d '{
  "userId":2
}' http://admin:admin@localhost:3000/api/teams/1/members

# 4. change admin password
curl -X PUT -H "Content-Type: application/json" -d '{
  "oldPassword": "admin",
  "newPassword": "newpass",
  "confirmNew": "newpass"
}' http://admin:admin@localhost:3000/api/user/password