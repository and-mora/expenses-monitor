#!/bin/sh

### Script to initialize the database on a machine with docker
wget https://raw.githubusercontent.com/and-mora/expenses-monitor/master/database/schema.sql
wget https://raw.githubusercontent.com/and-mora/expenses-monitor/master/database/init-system-users.sql

# copy sql files into the container
docker cp schema.sql $(docker ps -f name=postgres -q):schema.sql
docker cp init-system-users.sql $(docker ps -f name=postgres -q):init-system-users.sql

# run sql files
docker exec -t $(docker ps -f name=postgres -q) psql -U postgres -d postgres -f schema.sql
docker exec -t $(docker ps -f name=postgres -q) psql -U postgres -d postgres -f init-system-users.sql

# delete sql files from container
docker exec -t $(docker ps -f name=postgres -q) rm schema.sql
docker exec -t $(docker ps -f name=postgres -q) rm init-system-users.sql
