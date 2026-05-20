# Quick Deploy to Existing kind Cluster

## Your Current Setup
- ✅ 3 nodes kind cluster (kindest/node:v1.31.1)
- ✅ Docker Compose running (need to stop it first)

## Step-by-Step Deployment

### 1. Stop Docker Compose (Free Ports 80/443)
```powershell
docker-compose down
```

### 2. Build Docker Images (If Not Already Built)
```powershell
docker-compose build
```

### 3. Get Your Cluster Name
```powershell
kind get clusters
```

### 4. Deploy to Kubernetes

```powershell
cd k8s

# Set your cluster name (replace with actual name from step 3)
$clusterName = "kind"  # or whatever your cluster is named

# Load images into kind cluster
kind load docker-image spd-milestones-backend:latest --name $clusterName
kind load docker-image spd-milestones-graphql:latest --name $clusterName
kind load docker-image spd-milestones-frontend:latest --name $clusterName

# Create namespace
kubectl apply -f namespace.yaml

# Deploy MongoDB
kubectl apply -f mongodb-pv.yaml
kubectl apply -f mongodb-deployment.yaml

# Wait for MongoDB
kubectl wait --for=condition=ready pod -l app=mongodb -n spd-milestones --timeout=300s

# Deploy Backend
kubectl apply -f backend-deployment.yaml

# Wait for Backend
kubectl wait --for=condition=ready pod -l app=backend -n spd-milestones --timeout=300s

# Deploy GraphQL
kubectl apply -f graphql-deployment.yaml

# Wait for GraphQL
kubectl wait --for=condition=ready pod -l app=graphql -n spd-milestones --timeout=300s

# Deploy Frontend
kubectl apply -f frontend-deployment.yaml

# Wait for Frontend
kubectl wait --for=condition=ready pod -l app=frontend -n spd-milestones --timeout=300s

# Deploy Ingress (if you have ingress controller)
kubectl apply -f ingress.yaml
```

### 5. Check Deployment
```powershell
# View all resources
kubectl get all -n spd-milestones

# View pods on each node
kubectl get pods -n spd-milestones -o wide

# View logs
kubectl logs -l app=backend -n spd-milestones --tail=50
```

### 6. Access Application

**Option A: If you have Ingress Controller**
- Add to hosts file: `127.0.0.1 spd.milestones`
- Visit: http://spd.milestones

**Option B: Port Forward (No Ingress)**
```powershell
# Forward frontend
kubectl port-forward svc/frontend 3000:3000 -n spd-milestones

# In another terminal, forward backend
kubectl port-forward svc/backend 4000:4000 -n spd-milestones

# Visit: http://localhost:3000
```

## Troubleshooting

### Pods Not Starting
```powershell
kubectl describe pod <pod-name> -n spd-milestones
kubectl logs <pod-name> -n spd-milestones
```

### Images Not Found
- Make sure you ran `kind load docker-image` for all images
- Use correct cluster name

### WSL Stops/Restarts
This is a Windows/Docker Desktop issue. To fix:
1. Open Docker Desktop Settings
2. Go to Resources → WSL Integration
3. Enable integration for your WSL distro
4. Restart Docker Desktop

**Or disable WSL2 backend:**
1. Docker Desktop → Settings → General
2. Uncheck "Use WSL 2 based engine"
3. Apply & Restart

## Clean Up

```powershell
# Delete application
kubectl delete namespace spd-milestones

# Or delete entire cluster
kind delete cluster --name $clusterName

# Restart Docker Compose
cd ..
docker-compose up -d
```

## Configuration Notes

- **Frontend**: Development mode with HMR
- **Backend/GraphQL**: Production mode with debug logging
- **Timezone**: GMT+6 (Asia/Dhaka)
- **No node affinity**: Works with any 3-node setup
- **Resource limits**: 256Mi-512Mi RAM, 250m-500m CPU per pod
