## Install prometheus helm chart

reference [here](https://github.com/prometheus-community/helm-charts/blob/main/charts/kube-prometheus-stack/README.md)

```
cd monitoring/k8s/helm
helm install prometheus-stack charts/* -f values.yaml
```
