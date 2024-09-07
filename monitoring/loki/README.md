```
helm upgrade --install loki charts/* -f values.yaml --wait --timeout 300s -n monitoring
```