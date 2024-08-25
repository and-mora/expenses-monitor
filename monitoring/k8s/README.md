## Install prometheus helm chart

reference [here](https://github.com/prometheus-community/helm-charts/blob/main/charts/kube-prometheus-stack/README.md)

```
cd monitoring/k8s/helm
•helm upgrade --install monitoring charts/* -f values.yaml
```
