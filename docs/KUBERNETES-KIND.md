# Kubernetes Deployment to kind Cluster

This guide explains how to deploy the SPD Milestones application to your existing kind cluster.

## Quick Deploy

Your kind cluster is already set up. To deploy:

```powershell
.\scripts\deploy-kind.ps1
```

This script will:
1. Switch to your kind cluster context (`kind-opsnav`)
2. Stop Docker Compose
3. Build all Docker images using docker-compose
4. Load images into the kind cluster
5. Deploy all services (MongoDB, Backend, GraphQL, Frontend)
6. Wait for all pods to be ready

## Access the Application

After deployment completes, access your application:

- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:4000
- **GraphQL**: http://localhost:4001/graphql

If these ports aren't accessible, use port forwarding:

```powershell
# Quick port forward script
.\scripts\k8s-port-forward.ps1

# Or manually
kubectl port-forward svc/frontend 3000:3000 -n spd-milestones
kubectl port-forward svc/backend 4000:4000 -n spd-milestones
kubectl port-forward svc/graphql 4001:4001 -n spd-milestones
```

## Monitoring

### Check Status

```powershell
# Full status with pod details
.\scripts\k8s-status.ps1

# View logs from all services
.\scripts\k8s-status.ps1 -Logs

# View logs from specific service
.\scripts\k8s-status.ps1 -Logs -Service backend

# Watch pods in real-time
.\scripts\k8s-status.ps1 -Watch
```

### Manual Commands

```powershell
# View all resources
kubectl get all -n spd-milestones

# View pods with node assignment
kubectl get pods -n spd-milestones -o wide

# Describe a pod
kubectl describe pod <pod-name> -n spd-milestones

# View logs
kubectl logs <pod-name> -n spd-milestones

# Follow logs
kubectl logs -f <pod-name> -n spd-milestones

# Shell into a pod
kubectl exec -it <pod-name> -n spd-milestones -- /bin/sh
```

## Troubleshooting

### Build Failures

If npm install fails during build:

```powershell
# Try with docker-compose directly
docker-compose build

# Or with no cache
docker-compose build --no-cache

# Then run deployment again
.\scripts\deploy-kind.ps1
```

### Images Not Loading

Manually load images into kind:

```powershell
kind load docker-image spd-milestones-backend:latest --name opsnav
kind load docker-image spd-milestones-graphql:latest --name opsnav
kind load docker-image spd-milestones-frontend:latest --name opsnav
```

### Pods Not Starting

Check pod status and events:

```powershell
kubectl get pods -n spd-milestones
kubectl describe pod <pod-name> -n spd-milestones
kubectl logs <pod-name> -n spd-milestones
```

Common issues:
- **ImagePullBackOff**: Image not loaded into kind cluster
- **CrashLoopBackOff**: Application error, check logs
- **Pending**: Resource constraints or PV issues

### MongoDB Issues

```powershell
# Check MongoDB pod
kubectl get pods -l app=mongodb -n spd-milestones

# View MongoDB logs
kubectl logs -l app=mongodb -n spd-milestones

# Restart MongoDB
kubectl rollout restart deployment/mongodb -n spd-milestones
```

## Cleanup

Remove all deployed resources:

```powershell
# Interactive cleanup (asks confirmation)
.\scripts\k8s-cleanup.ps1

# Force cleanup
.\scripts\k8s-cleanup.ps1 -Force

# Keep namespace but remove resources
.\scripts\k8s-cleanup.ps1 -KeepNamespace
```

Manual cleanup:

```powershell
# Delete everything
kubectl delete namespace spd-milestones

# Delete persistent volumes
kubectl delete pv mongo-pv
```

## Your kind Cluster Details

Based on your [kind-config.yaml](kind-config.yaml):

- **Cluster Name**: opsnav (context: kind-opsnav)
- **Nodes**: 3 nodes (1 control-plane + 2 workers)
- **Exposed Ports**:
  - 80/443: Ingress
  - 3000: Frontend
  - 4000: Backend
  - 4001: GraphQL
  - 27017: MongoDB

### Port Mappings

Your kind cluster maps these ports from the control-plane node to localhost:

| Service   | Container Port | Host Port | Access URL              |
|-----------|----------------|-----------|-------------------------|
| Frontend  | 30300          | 3000      | http://localhost:3000   |
| Backend   | 30400          | 4000      | http://localhost:4000   |
| GraphQL   | 30401          | 4001      | http://localhost:4001   |
| MongoDB   | 27017          | 27017     | localhost:27017         |

## Architecture

The deployment consists of:

- **MongoDB**: 1 replica with persistent storage (5Gi)
- **Backend API**: 2 replicas (REST API)
- **GraphQL API**: 2 replicas (GraphQL endpoint)
- **Frontend**: 2 replicas (React SPA)

Pods are distributed across your 2 worker nodes.

## Switching Between Docker Compose and Kubernetes

### To Kubernetes (kind)

```powershell
# Deploy to kind
.\scripts\deploy-kind.ps1

# Access via port forward
.\scripts\k8s-port-forward.ps1
```

### Back to Docker Compose

```powershell
# Cleanup Kubernetes
.\scripts\k8s-cleanup.ps1 -Force

# Start Docker Compose
docker-compose up -d
```

## Useful Commands

```powershell
# List all kind clusters
kind get clusters

# View cluster info
kubectl cluster-info --context kind-opsnav

# View nodes
kubectl get nodes

# View node labels
kubectl get nodes --show-labels

# Scale a deployment
kubectl scale deployment/backend --replicas=3 -n spd-milestones

# Restart a deployment
kubectl rollout restart deployment/backend -n spd-milestones

# View rollout status
kubectl rollout status deployment/backend -n spd-milestones

# View resource usage
kubectl top pods -n spd-milestones
kubectl top nodes
```

## Files Reference

| File | Purpose |
|------|---------|
| `scripts/deploy-kind.ps1` | Main deployment script for kind |
| `scripts/k8s-port-forward.ps1` | Easy port forwarding |
| `scripts/k8s-status.ps1` | Status and monitoring |
| `scripts/k8s-cleanup.ps1` | Cleanup resources |
| `k8s/namespace.yaml` | Namespace definition |
| `k8s/mongodb-pv.yaml` | MongoDB persistent volume |
| `k8s/mongodb-deployment.yaml` | MongoDB deployment |
| `k8s/backend-deployment.yaml` | Backend API deployment |
| `k8s/graphql-deployment.yaml` | GraphQL API deployment |
| `k8s/frontend-deployment.yaml` | Frontend deployment |
| `k8s/ingress.yaml` | Ingress configuration (optional) |
| `k8s/kind-config.yaml` | kind cluster configuration |

## Tips

1. **First deployment is slow** - Docker builds take time. Subsequent deployments reuse images.

2. **Use docker-compose for building** - It handles caching better than individual docker build commands.

3. **Check pod distribution** - Use `kubectl get pods -n spd-milestones -o wide` to see which node each pod runs on.

4. **Persistent data** - MongoDB data persists in a PersistentVolume. It survives pod restarts but not cluster deletion.

5. **Load images after rebuild** - If you rebuild images, run `kind load docker-image` again to update the cluster.

## Next Steps

- Scale deployments: `kubectl scale deployment/backend --replicas=3 -n spd-milestones`
- Install Kubernetes Dashboard for visual monitoring
- Set up Ingress controller for unified access
- Explore Helm charts for easier deployments
- Monitor with Prometheus and Grafana

## Support

For issues:
- Check logs: `.\scripts\k8s-status.ps1 -Logs`
- Describe pods: `kubectl describe pod <pod-name> -n spd-milestones`
- Check events: `kubectl get events -n spd-milestones --sort-by='.lastTimestamp'`
