## Install monitoring helm chart

reference [here](https://github.com/prometheus-community/helm-charts/blob/main/charts/kube-prometheus-stack/README.md)

```
kubectl create namespace monitoring
cd monitoring/k8s/helm
read -sp 'Enter smtp username: ' SMTP_USER 
read -sp 'Enter smtp password: ' SMTP_PASSWORD
read -sp 'Enter grafana admin username: ' GRAFANA_ADMIN_USER
read -sp 'Enter grafana admin password: ' GRAFANA_ADMIN_PASSWORD
kubectl create secret generic grafana-smtp-credentials --from-literal=username=$SMTP_USER --from-literal=password=$SMTP_PASSWORD -n monitoring
kubectl create secret generic grafana-db-credentials --from-literal=DB_GRAFANA_USERNAME=$USERNAME_GRAFANA --from-literal=DB_GRAFANA_PASSWORD=$PASS_USER_GRAFANA -n monitoring
kubectl create secret generic grafana-admin-credentials --from-literal=admin-user=$GRAFANA_ADMIN_USER --from-literal=admin-password=$GRAFANA_ADMIN_PASSWORD -n monitoring
helm upgrade --install monitoring charts/* -f values.yaml -n monitoring
```

Only Google SMTP is configured in grafana.ini
