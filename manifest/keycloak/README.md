# Installation

## Requirements 

### (optional) Install SealedSecrets

I used the [SealedSecrets](https://github.com/bitnami-labs/sealed-secrets) to store the secrets in the git repository.

```
# Create a json/yaml-encoded Secret somehow:
# (note use of `--dry-run` - this is just a local file!)
echo -n bar | kubectl create secret generic mysecret --dry-run=client --from-file=foo=/dev/stdin -o json >mysecret.json

# This is the important bit:
kubeseal -f mysecret.json -w mysealedsecret.json

# At this point mysealedsecret.json is safe to upload to Github,
# post on Twitter, etc.

# Eventually:
kubectl create -f mysealedsecret.json

# Profit!
kubectl get secret mysecret
```

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

