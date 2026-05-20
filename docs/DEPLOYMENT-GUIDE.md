# SPD Milestones - kind Cluster Deployment Guide

## Overview

This guide shows how to deploy SPD Milestones to a **kind** (Kubernetes IN Docker) cluster running inside Docker Desktop on Windows.

## What is kind?

**kind** = Kubernetes IN Docker - creates Kubernetes clusters using Docker containers as nodes. Perfect for local development and testing.

## Architecture

```
Docker Desktop (Windows)
└── kind Cluster "spd-cluster"
    ├── Control Plane Node (1)
    │   ├── API Server
    │   ├── Scheduler
    │   ├── Controller Manager
    │   └── etcd
    │
    └── Worker Nodes (2)
        ├── Worker 1 (tier=backend)
        │   ├── Backend Pods (2 replicas)
        │   ├── GraphQL Pods (2 replicas)
        │   └── MongoDB Pod (1 replica)
        │
        └── Worker 2 (tier=frontend)
            └── Frontend Pods (2 replicas)
```

## How Many Nodes?

### Our Configuration: **3 Nodes Total**

1. **1 Control Plane Node**
   - Manages the Kubernetes cluster
   - Runs core K8s components
   - Handles ingress (exposes ports 80, 443)

2. **2 Worker Nodes**
   - Run application workloads
   - Separated by tier for better resource management
   - Node 1: Backend services (API + Database)
   - Node 2: Frontend services (UI)

### Why 3 Nodes?

- **Simulates production** - Multi-node setup like real clusters
- **Node affinity** - Backend and frontend on separate nodes
- **Load balancing** - Multiple replicas distributed across nodes
- **Resource isolation** - Each tier gets dedicated resources
- **Scalability testing** - Test how app scales across nodes

### Alternative Configurations

<details>
<summary><b>Minimal (1 node)</b> - For basic testing only</summary>

```yaml
nodes:
  - role: control-plane
    kubeadmConfigPatches:
      - |
        kind: InitConfiguration
        nodeRegistration:
          kubeletExtraArgs:
            node-labels: "ingress-ready=true"
    extraPortMappings:
      - containerPort: 80
        hostPort: 80
      - containerPort: 443
        hostPort: 443
```

**Pros**: Fast startup, minimal resources  
**Cons**: No multi-node testing, everything on control plane
</details>

<details>
<summary><b>Standard (1 control + 1 worker)</b> - Basic separation</summary>

```yaml
nodes:
  - role: control-plane
    kubeadmConfigPatches:
      - |
        kind: InitConfiguration
        nodeRegistration:
          kubeletExtraArgs:
            node-labels: "ingress-ready=true"
    extraPortMappings:
      - containerPort: 80
        hostPort: 80
      - containerPort: 443
        hostPort: 443
  - role: worker
```

**Pros**: Clean separation, faster than 3 nodes  
**Cons**: Can't test node affinity across tiers
</details>

<details>
<summary><b>Production-Like (1 control + 3 workers)</b> - Maximum simulation</summary>

```yaml
nodes:
  - role: control-plane
  - role: worker
    labels:
      tier: database
  - role: worker
    labels:
      tier: backend
  - role: worker
    labels:
      tier: frontend
```

**Pros**: Most realistic, dedicated database node  
**Cons**: High resource usage, slower startup
</details>

## Prerequisites

### 1. Docker Desktop

- Must be running
- Recommended: 4GB+ RAM, 2+ CPUs allocated
- Windows 10/11 Pro/Enterprise (for Hyper-V) or WSL2

### 2. Install kind

```powershell
# Using Chocolatey (recommended)
choco install kind

# Or using Scoop
scoop install kind

# Or download binary from https://kind.sigs.k8s.io/
```

Verify installation:
```powershell
kind --version
# Should output: kind v0.20.0 (or higher)
```

### 3. Install kubectl

```powershell
# Using Chocolatey
choco install kubernetes-cli

# Or using Scoop
scoop install kubectl

# Or download from https://kubernetes.io/docs/tasks/tools/install-kubectl-windows/
```

Verify installation:
```powershell
kubectl version --client
```

### 4. Build Docker Images

From project root:
```powershell
docker-compose build
```

This creates:
- `spd-milestones-backend:latest`
- `spd-milestones-graphql:latest`
- `spd-milestones-frontend:latest`

## Deployment Steps

### Option 1: Automated (Recommended)

```powershell
cd k8s

# Step 1: Create cluster
.\setup-cluster.ps1

# Step 2: Deploy application
.\deploy-app.ps1
```

### Option 2: Manual

<details>
<summary>Click to expand manual steps</summary>

```powershell
cd k8s

# 1. Create cluster from config
kind create cluster --config kind-config.yaml

# 2. Verify cluster is running
kubectl cluster-info --context kind-spd-cluster

# 3. View nodes
kubectl get nodes

# 4. Install NGINX Ingress Controller
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/kind/deploy.yaml

# 5. Wait for ingress controller
kubectl wait --namespace ingress-nginx `
  --for=condition=ready pod `
  --selector=app.kubernetes.io/component=controller `
  --timeout=300s

# 6. Create namespace
kubectl apply -f namespace.yaml

# 7. Load Docker images into kind cluster
kind load docker-image spd-milestones-backend:latest --name spd-cluster
kind load docker-image spd-milestones-graphql:latest --name spd-cluster
kind load docker-image spd-milestones-frontend:latest --name spd-cluster

# 8. Deploy in order (dependencies)
kubectl apply -f mongodb-pv.yaml
kubectl apply -f mongodb-deployment.yaml

# Wait for MongoDB
kubectl wait --for=condition=ready pod -l app=mongodb -n spd-milestones --timeout=300s

kubectl apply -f backend-deployment.yaml

# Wait for Backend
kubectl wait --for=condition=ready pod -l app=backend -n spd-milestones --timeout=300s

kubectl apply -f graphql-deployment.yaml

# Wait for GraphQL
kubectl wait --for=condition=ready pod -l app=graphql -n spd-milestones --timeout=300s

kubectl apply -f frontend-deployment.yaml

# Wait for Frontend
kubectl wait --for=condition=ready pod -l app=frontend -n spd-milestones --timeout=300s

# 9. Deploy Ingress
kubectl apply -f ingress.yaml

# 10. Verify deployment
kubectl get all -n spd-milestones
```
</details>

## Access the Application

### 1. Update Hosts File

**As Administrator**, edit:
```
C:\Windows\System32\drivers\etc\hosts
```

Add:
```
127.0.0.1 spd.milestones
```

### 2. Open Browser

Navigate to:
```
http://spd.milestones
```

## Verify Deployment

### Check All Resources

```powershell
kubectl get all -n spd-milestones
```

Expected output:
```
NAME                           READY   STATUS    RESTARTS   AGE
pod/backend-xxxxx-xxx          1/1     Running   0          5m
pod/backend-xxxxx-yyy          1/1     Running   0          5m
pod/frontend-xxxxx-xxx         1/1     Running   0          5m
pod/frontend-xxxxx-yyy         1/1     Running   0          5m
pod/graphql-xxxxx-xxx          1/1     Running   0          5m
pod/graphql-xxxxx-yyy          1/1     Running   0          5m
pod/mongodb-xxxxx-xxx          1/1     Running   0          5m

NAME               TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)    AGE
service/backend    ClusterIP   10.96.x.x       <none>        4000/TCP   5m
service/frontend   ClusterIP   10.96.x.x       <none>        3000/TCP   5m
service/graphql    ClusterIP   10.96.x.x       <none>        4001/TCP   5m
service/mongodb    ClusterIP   10.96.x.x       <none>        27017/TCP  5m

NAME                       READY   UP-TO-DATE   AVAILABLE   AGE
deployment.apps/backend    2/2     2            2           5m
deployment.apps/frontend   2/2     2            2           5m
deployment.apps/graphql    2/2     2            2           5m
deployment.apps/mongodb    1/1     1            1           5m
```

### Check Pods on Each Node

```powershell
kubectl get pods -n spd-milestones -o wide
```

You should see pods distributed across worker nodes:
```
NAME                       NODE                     STATUS
backend-xxxxx-xxx          spd-cluster-worker       Running
backend-xxxxx-yyy          spd-cluster-worker       Running
graphql-xxxxx-xxx          spd-cluster-worker       Running
graphql-xxxxx-yyy          spd-cluster-worker       Running
mongodb-xxxxx-xxx          spd-cluster-worker       Running
frontend-xxxxx-xxx         spd-cluster-worker2      Running
frontend-xxxxx-yyy         spd-cluster-worker2      Running
```

### Check Ingress

```powershell
kubectl get ingress -n spd-milestones
```

Expected:
```
NAME          CLASS   HOSTS             ADDRESS     PORTS   AGE
spd-ingress   nginx   spd.milestones    localhost   80      5m
```

### View Logs

```powershell
# Backend logs
kubectl logs -l app=backend -n spd-milestones --tail=50 -f

# Frontend logs
kubectl logs -l app=frontend -n spd-milestones --tail=50 -f

# GraphQL logs
kubectl logs -l app=graphql -n spd-milestones --tail=50 -f
```

## Managing the Cluster

### Scale Services

```powershell
# Scale backend to 3 replicas
kubectl scale deployment backend --replicas=3 -n spd-milestones

# Scale frontend to 4 replicas
kubectl scale deployment frontend --replicas=4 -n spd-milestones

# Verify scaling
kubectl get pods -n spd-milestones
```

### Update Application

After code changes:

```powershell
# 1. Rebuild Docker images
cd ..
docker-compose build

# 2. Load new images
cd k8s
kind load docker-image spd-milestones-backend:latest --name spd-cluster
kind load docker-image spd-milestones-graphql:latest --name spd-cluster
kind load docker-image spd-milestones-frontend:latest --name spd-cluster

# 3. Restart deployments
kubectl rollout restart deployment backend -n spd-milestones
kubectl rollout restart deployment graphql -n spd-milestones
kubectl rollout restart deployment frontend -n spd-milestones

# 4. Watch rollout
kubectl rollout status deployment backend -n spd-milestones
```

### Inspect Resources

```powershell
# Describe pod (see events, status)
kubectl describe pod <pod-name> -n spd-milestones

# Get pod logs
kubectl logs <pod-name> -n spd-milestones

# Execute command in pod
kubectl exec -it <pod-name> -n spd-milestones -- /bin/sh

# Port forward to service
kubectl port-forward svc/backend 4000:4000 -n spd-milestones
```

### Cluster Information

```powershell
# View nodes
kubectl get nodes -o wide

# View node resources
kubectl top nodes

# View pod resources
kubectl top pods -n spd-milestones

# Cluster info
kubectl cluster-info

# View all namespaces
kubectl get namespaces
```

## Troubleshooting

### Pods Not Starting

```powershell
# Check pod status
kubectl get pods -n spd-milestones

# Describe pod for events
kubectl describe pod <pod-name> -n spd-milestones

# Check logs
kubectl logs <pod-name> -n spd-milestones --previous
```

Common issues:
- **ImagePullBackOff**: Image not loaded into kind (`kind load docker-image`)
- **CrashLoopBackOff**: Application error (check logs)
- **Pending**: Insufficient resources or scheduling issues

### Services Not Accessible

```powershell
# Check services
kubectl get svc -n spd-milestones

# Check endpoints
kubectl get endpoints -n spd-milestones

# Test from inside cluster
kubectl run test --rm -it --image=busybox -n spd-milestones -- /bin/sh
# Then: wget -qO- http://backend:4000/health
```

### Ingress Not Working

```powershell
# Check ingress controller
kubectl get pods -n ingress-nginx

# Check ingress resource
kubectl describe ingress spd-ingress -n spd-milestones

# Check ingress controller logs
kubectl logs -n ingress-nginx -l app.kubernetes.io/component=controller
```

### Cluster Issues

```powershell
# Check Docker containers (nodes are containers)
docker ps | Select-String "kind"

# Restart Docker Desktop if nodes are unhealthy
# Then recreate cluster
```

## Cleanup

### Delete Application Only

```powershell
cd k8s
kubectl delete -f . -n spd-milestones
```

### Delete Entire Cluster

```powershell
kind delete cluster --name spd-cluster
```

This removes:
- All pods, services, deployments
- Persistent volumes
- The 3 Docker containers (nodes)
- kubectl context

### Verify Deletion

```powershell
kind get clusters
# Should not list spd-cluster

docker ps | Select-String "kind"
# Should not show any kind nodes
```

## Resource Requirements

### Minimum

- **RAM**: 4GB allocated to Docker Desktop
- **CPU**: 2 cores
- **Disk**: 10GB free space

### Recommended

- **RAM**: 8GB allocated to Docker Desktop
- **CPU**: 4 cores
- **Disk**: 20GB free space

### Check Docker Resources

```powershell
docker info | Select-String "CPUs|Memory"
```

## FAQ

**Q: Can I run this alongside docker-compose?**  
A: Yes! They use different networking. Stop docker-compose first to free ports 80/443.

**Q: How is this different from docker-compose?**  
A: kind uses Kubernetes orchestration (pods, services, deployments) while docker-compose uses simpler container management. kind better simulates production.

**Q: Can I use Docker Desktop's built-in Kubernetes?**  
A: Yes, but kind is more flexible and can create multi-node clusters.

**Q: How much does kind cluster use?**  
A: Typically 2-4GB RAM for 3-node cluster with our app deployed.

**Q: Can I access individual services?**  
A: Yes, use `kubectl port-forward`:
```powershell
kubectl port-forward svc/backend 4000:4000 -n spd-milestones
# Now access http://localhost:4000
```

**Q: How do I reset everything?**  
A:
```powershell
kind delete cluster --name spd-cluster
docker system prune -a
.\setup-cluster.ps1
.\deploy-app.ps1
```

## Next Steps

1. **Monitoring**: Add Prometheus & Grafana
2. **CI/CD**: Automate deployment with GitHub Actions
3. **Helm**: Package deployments as Helm charts
4. **Production**: Deploy to real Kubernetes (GKE, EKS, AKS)

## Additional Resources

- [kind Documentation](https://kind.sigs.k8s.io/)
- [Kubernetes Basics](https://kubernetes.io/docs/tutorials/kubernetes-basics/)
- [kubectl Cheat Sheet](https://kubernetes.io/docs/reference/kubectl/cheatsheet/)
- [Kubernetes Best Practices](https://kubernetes.io/docs/concepts/configuration/overview/)
