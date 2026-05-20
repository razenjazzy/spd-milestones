# Kubernetes Deployment Guide for Docker Desktop

This guide will help you deploy the SPD Milestones application to Kubernetes running on Docker Desktop on your local Windows PC.

## Prerequisites

1. **Docker Desktop** installed and running
2. **Kubernetes enabled** in Docker Desktop
3. **kubectl** command-line tool (included with Docker Desktop)

### Enable Kubernetes in Docker Desktop

If you haven't enabled Kubernetes yet:

1. Open Docker Desktop
2. Click the Settings icon (gear icon)
3. Go to **Kubernetes** section
4. Check **Enable Kubernetes**
5. Click **Apply & Restart**
6. Wait for Kubernetes to start (you'll see a green indicator)

## Quick Start

### Step 1: Deploy to Kubernetes

Run the deployment script:

```powershell
.\scripts\deploy-k8s-docker-desktop.ps1
```

This script will:
- Stop Docker Compose if running
- Build all Docker images (backend, graphql, frontend)
- Create the Kubernetes namespace
- Deploy MongoDB with persistent storage
- Deploy Backend API
- Deploy GraphQL API
- Deploy Frontend
- Show deployment status

**Time:** First deployment takes 5-10 minutes (building images)

### Step 2: Access the Application

**Option A: Port Forwarding (Recommended)**

Run the port forwarding script:

```powershell
.\scripts\k8s-port-forward.ps1
```

This opens three PowerShell windows with port forwards. Access the application at:
- Frontend: http://localhost:3000
- Backend: http://localhost:4000
- GraphQL: http://localhost:4001/graphql

**Option B: Manual Port Forwarding**

In separate terminal windows, run:

```powershell
# Terminal 1 - Frontend
kubectl port-forward svc/frontend 3000:3000 -n spd-milestones

# Terminal 2 - Backend  
kubectl port-forward svc/backend 4000:4000 -n spd-milestones

# Terminal 3 - GraphQL
kubectl port-forward svc/graphql 4001:4001 -n spd-milestones
```

Then visit: http://localhost:3000

## Monitoring and Troubleshooting

### Check Deployment Status

```powershell
# View all resources
.\scripts\k8s-status.ps1

# View with logs
.\scripts\k8s-status.ps1 -Logs

# View logs for specific service
.\scripts\k8s-status.ps1 -Logs -Service backend

# Watch pods in real-time
.\scripts\k8s-status.ps1 -Watch
```

### Manual Kubernetes Commands

```powershell
# View all resources
kubectl get all -n spd-milestones

# View pods
kubectl get pods -n spd-milestones

# View pod details
kubectl describe pod <pod-name> -n spd-milestones

# View logs
kubectl logs <pod-name> -n spd-milestones

# Follow logs
kubectl logs -f <pod-name> -n spd-milestones

# View logs from all pods of a service
kubectl logs -l app=backend -n spd-milestones --tail=50

# Shell into a pod
kubectl exec -it <pod-name> -n spd-milestones -- /bin/sh
```

### Common Issues

#### Pods not starting

Check pod status and events:
```powershell
kubectl get pods -n spd-milestones
kubectl describe pod <pod-name> -n spd-milestones
```

#### Image pull errors

Kubernetes uses local images. Make sure images are built:
```powershell
docker images | Select-String "spd-milestones"
```

If missing, rebuild:
```powershell
docker-compose build
```

#### Database connection issues

Check MongoDB status:
```powershell
kubectl logs -l app=mongodb -n spd-milestones --tail=50
kubectl get pods -l app=mongodb -n spd-milestones
```

Restart MongoDB if needed:
```powershell
kubectl rollout restart deployment/mongodb -n spd-milestones
```

## Cleanup

### Remove all resources

```powershell
# Interactive cleanup (asks for confirmation)
.\scripts\k8s-cleanup.ps1

# Force cleanup without confirmation
.\scripts\k8s-cleanup.ps1 -Force

# Keep namespace but remove resources
.\scripts\k8s-cleanup.ps1 -KeepNamespace
```

### Manual cleanup

```powershell
# Delete everything
kubectl delete namespace spd-milestones

# Delete persistent volumes
kubectl delete pv mongo-pv
```

## Architecture

The deployment consists of:

- **MongoDB**: 1 replica with persistent storage (5Gi)
- **Backend API**: 2 replicas (REST API)
- **GraphQL API**: 2 replicas (GraphQL endpoint)
- **Frontend**: 2 replicas (React SPA)

All services are exposed via ClusterIP and communicate internally within the cluster.

## Resource Requirements

Each service has resource limits:

| Service   | CPU Request | Memory Request | CPU Limit | Memory Limit |
|-----------|-------------|----------------|-----------|--------------|
| MongoDB   | 500m        | 512Mi          | 1000m     | 1Gi          |
| Backend   | 500m        | 512Mi          | 1000m     | 1Gi          |
| GraphQL   | 250m        | 256Mi          | 500m      | 512Mi        |
| Frontend  | 500m        | 512Mi          | 1000m     | 1Gi          |

**Total**: ~1.75 CPU cores and ~2Gi RAM minimum

## Advanced: Ingress Setup (Optional)

If you want to use a single domain instead of port forwarding:

### Install NGINX Ingress Controller

```powershell
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.2/deploy/static/provider/cloud/deploy.yaml
```

Wait for it to be ready:

```powershell
kubectl wait --namespace ingress-nginx --for=condition=ready pod --selector=app.kubernetes.io/component=controller --timeout=300s
```

### Deploy Ingress

```powershell
kubectl apply -f k8s/ingress.yaml
```

### Update Hosts File

Add this line to `C:\Windows\System32\drivers\etc\hosts`:

```
127.0.0.1 spd.milestones
```

Then access: http://spd.milestones

## Switching Between Docker Compose and Kubernetes

### Switch to Kubernetes

```powershell
# Stop Docker Compose
docker-compose down

# Deploy to Kubernetes
.\scripts\deploy-k8s-docker-desktop.ps1
.\scripts\k8s-port-forward.ps1
```

### Switch back to Docker Compose

```powershell
# Cleanup Kubernetes
.\scripts\k8s-cleanup.ps1 -Force

# Start Docker Compose
docker-compose up -d
```

## Files Reference

| File | Purpose |
|------|---------|
| `k8s/namespace.yaml` | Creates spd-milestones namespace |
| `k8s/mongodb-pv.yaml` | Persistent volume for MongoDB |
| `k8s/mongodb-deployment.yaml` | MongoDB deployment and service |
| `k8s/backend-deployment.yaml` | Backend API deployment and service |
| `k8s/graphql-deployment.yaml` | GraphQL API deployment and service |
| `k8s/frontend-deployment.yaml` | Frontend deployment and service |
| `k8s/ingress.yaml` | Ingress configuration (optional) |
| `scripts/deploy-k8s-docker-desktop.ps1` | Main deployment script |
| `scripts/k8s-port-forward.ps1` | Easy port forwarding |
| `scripts/k8s-status.ps1` | Status and monitoring |
| `scripts/k8s-cleanup.ps1` | Cleanup resources |

## Tips

1. **First deployment is slow** - Docker needs to build images. Subsequent deployments are faster.

2. **Use port forwarding** - It's the simplest way to access services locally.

3. **Check logs frequently** - Use `k8s-status.ps1 -Logs` to see what's happening.

4. **Persistent data** - MongoDB data persists in a PersistentVolume. Data survives pod restarts but not cleanup.

5. **Resource usage** - Docker Desktop Kubernetes runs on your PC. Make sure you have allocated enough resources to Docker Desktop (Settings > Resources).

## Next Steps

- Explore Kubernetes Dashboard: `kubectl proxy` and visit http://localhost:8001/api/v1/namespaces/kubernetes-dashboard/services/https:kubernetes-dashboard:/proxy/
- Learn kubectl: https://kubernetes.io/docs/reference/kubectl/cheatsheet/
- Scale deployments: `kubectl scale deployment/backend --replicas=3 -n spd-milestones`

## Support

For issues specific to:
- Kubernetes setup: Check Docker Desktop settings
- Application errors: Check logs with `k8s-status.ps1 -Logs`
- Deployment failures: Check pod descriptions with `kubectl describe pod`
