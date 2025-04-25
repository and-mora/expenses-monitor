# ArgoCD
ArgoCD is a declarative, GitOps continuous delivery tool for Kubernetes.

## Install ArgoCD with Helm
Create the `Chart.yaml`.

Run the following commands:
```
kubectl create namespace argocd
helm dependency build
helm upgrade --install argocd charts/* -f values.yaml -n argocd
```
