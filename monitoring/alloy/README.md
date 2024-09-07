```
kubectl create cm alloy-config --from-file=config.alloy --dry-run=client -o yaml -n monitoring | kubectl apply -f -
helm upgrade --install --namespace monitoring alloy grafana/alloy -f values.yaml
```