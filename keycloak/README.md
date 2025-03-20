# Installation

## Requirements 

### (optional) Install SealedSecrets

I used the [SealedSecrets](https://github.com/bitnami-labs/sealed-secrets) to store the secrets in the git repository.



### Secrets

Create the Kubernetes secrets to configure the keycloak bootstrap admin user and the postgres credentials.



```bash
kubectl create secret generic keycloak-secrets --from-literal=adminUser=<user> --from-literal=adminPassword=<password> 
kubectl create secret generic postgres-credentials-for-keycloak --from-literal=user=<user> --from-literal=password=<password>  --from-literal=schema=<schema> --from-literal=db=<db>
```

## Deploy

To deploy run: 
```bash

kubectl apply -f manifest.yaml
```

