#!/bin/sh

### Script to initialize the database on a machine with docker
wget https://raw.githubusercontent.com/and-mora/expenses-monitor/master/database/schema.sql
wget https://raw.githubusercontent.com/and-mora/expenses-monitor/master/database/init-system-users.sql

# copy sql files into the container
sudo docker cp schema.sql $(sudo docker ps -f name=postgres -q):schema.sql
sudo docker cp init-system-users.sql $(sudo docker ps -f name=postgres -q):init-system-users.sql

# run sql files
sudo docker exec -t $(sudo docker ps -f name=postgres -q) psql -U postgres -d postgres -f schema.sql
sudo docker exec -t $(sudo docker ps -f name=postgres -q) psql -U postgres -d postgres -f init-system-users.sql

# delete sql files from container
sudo docker exec -t $(sudo docker ps -f name=postgres -q) rm schema.sql
sudo docker exec -t $(sudo docker ps -f name=postgres -q) rm init-system-users.sql
