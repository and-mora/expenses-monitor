## Install monitoring helm chart

reference [here](https://github.com/prometheus-community/helm-charts/blob/main/charts/kube-prometheus-stack/README.md)

```
cd monitoring/k8s/helm
read -sp 'Enter smtp username: ' SMTP_USER 
read -sp 'Enter smtp password: ' SMTP_PASSWORD
kubectl create secret generic grafana-smtp-credentials --from-literal=username=$SMTP_USER --from-literal=password=$SMTP_PASSWORD
helm upgrade --install monitoring charts/* -f values.yaml
```

Only Google SMTP is configured in grafana.ini
