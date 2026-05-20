# SPD Milestones - Deployment Guide v1.0

## Table of Contents
1. [Quick Start](#quick-start)
2. [Prerequisites](#prerequisites)
3. [Environment Setup](#environment-setup)
4. [Deployment Options](#deployment-options)
5. [Post-Deployment](#post-deployment)
6. [Monitoring](#monitoring)
7. [Troubleshooting](#troubleshooting)

## Quick Start

```bash
# Clone repository
git clone https://github.com/your-org/spd-milestones.git
cd spd-milestones

# Start services
docker-compose up -d

# Verify deployment
curl http://localhost/health

# Access application
open https://spd.milestones  # or http://localhost
```

## Prerequisites

### Required Software
- Docker 20.10+ & Docker Compose 2.0+
- Node.js 20+ (for local development)
- MongoDB 4.4+ (for local development)
- Git

### Optional Tools
- kubectl (for Kubernetes)
- helm (for Kubernetes)
- terraform (for infrastructure)
- ansible (for configuration)

## Environment Setup

### 1. Configure Environment Variables

#### Backend (.env)
```bash
cp backend/.env.example backend/.env
# Edit backend/.env with your values
```

Key variables:
- `MONGO_URI`: MongoDB connection string
- `PORT`: Backend port (default: 4000)
- `LOG_LEVEL`: info | debug | warn | error

#### Frontend (.env)
```bash
cp frontend/.env.example frontend/.env
# Edit frontend/.env with your values
```

Key variables:
- `VITE_API_BASE`: API endpoint (default: /api)
- `VITE_GRAPHQL_URI`: GraphQL endpoint (default: /graphql)

### 2. SSL Certificates (Optional)

```bash
# Generate self-signed certificate
cd nginx/certs
./generate-cert.sh

# Or use your own certificates
cp your-cert.crt spd.milestones.crt
cp your-key.key spd.milestones.key
```

## Deployment Options

### Option 1: Docker Desktop (Development)

**Best for**: Local development, testing

```bash
# Build and start
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

**Pros**:
- Quick setup
- Easy to debug
- Automatic rebuilds

**Cons**:
- Not production-ready
- No high availability
- Limited scaling

---

### Option 2: Docker Swarm (Single Server)

**Best for**: Small production deployments, single server

```bash
# Initialize swarm
docker swarm init

# Deploy stack
docker stack deploy -c docker-stack.yml spd

# Check services
docker service ls

# Scale services
docker service scale spd_backend=3

# Remove stack
docker stack rm spd
```

**Pros**:
- Simple orchestration
- Built-in load balancing
- Easy scaling

**Cons**:
- Limited to single server (or small cluster)
- Basic features compared to K8s

---

### Option 3: Kubernetes (Production)

**Best for**: Production deployments, high availability, multi-server

#### Prerequisites
```bash
# Install kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"

# Verify cluster access
kubectl cluster-info
```

#### Deploy
```bash
# Create namespace
kubectl create namespace spd-milestones

# Apply configurations
kubectl apply -f k8s/

# Check deployment
kubectl get pods -n spd-milestones
kubectl get svc -n spd-milestones

# Get external IP
kubectl get svc nginx-service -n spd-milestones
```

#### Scale
```bash
# Manual scaling
kubectl scale deployment backend --replicas=5 -n spd-milestones

# Auto-scaling (HPA already configured)
kubectl autoscale deployment backend --cpu-percent=70 --min=2 --max=10 -n spd-milestones
```

**Pros**:
- Production-grade
- High availability
- Auto-scaling
- Self-healing
- Rolling updates

**Cons**:
- Complex setup
- Higher resource usage
- Steeper learning curve

---

### Option 4: Cloud Platforms

#### AWS ECS/EKS
```bash
# Using AWS CLI and eksctl
eksctl create cluster --name spd-cluster --region us-east-1

# Deploy using kubectl (same as Option 3)
```

#### Azure AKS
```bash
# Using Azure CLI
az aks create --resource-group spd-rg --name spd-cluster

# Get credentials
az aks get-credentials --resource-group spd-rg --name spd-cluster
```

#### Google Cloud GKE
```bash
# Using gcloud
gcloud container clusters create spd-cluster --zone us-central1-a

# Deploy using kubectl
```

#### DigitalOcean
```bash
# Using doctl
doctl kubernetes cluster create spd-cluster

# Deploy using kubectl
```

---

### Option 5: Docker Hub + Pull

**Best for**: Quick deployment from pre-built images

```bash
# Pull images
docker pull username/spdmilestones-backend:latest
docker pull username/spdmilestones-frontend:latest
docker pull username/spdmilestones-nginx:latest

# Run with docker-compose (using remote images)
docker-compose -f docker-compose.prod.yml up -d
```

## Post-Deployment

### 1. Verify Services

```bash
# Check container status
docker ps

# Check health endpoints
curl http://localhost/health         # Main health
curl http://localhost/api/projects   # Backend API
curl http://localhost/graphql        # GraphQL (POST)

# Check logs
docker-compose logs backend
docker-compose logs frontend
docker-compose logs nginx
```

### 2. Initialize Database

```bash
# The database auto-initializes on first run
# To add sample data:
docker exec spd_mongo mongo spd --eval '
db.projects.insertMany([
  {
    name: "Website Redesign",
    description: "Complete website overhaul",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "Mobile App",
    description: "iOS and Android app",
    createdAt: new Date(),
    updatedAt: new Date()
  }
])
'
```

### 3. Run Tests

```bash
# Navigate to /tests in the application
# Click "Run Tests" button
# Or use API:
curl -X POST http://localhost/api/tests/run
```

### 4. Configure DNS (Production)

```bash
# Point your domain to server IP
A     spd.milestones     -> YOUR_SERVER_IP
CNAME www.spdmilestones  -> spd.milestones
```

### 5. Setup SSL (Production)

```bash
# Using Let's Encrypt
certbot certonly --standalone -d spd.milestones

# Copy certificates
cp /etc/letsencrypt/live/spd.milestones/fullchain.pem nginx/certs/spd.milestones.crt
cp /etc/letsencrypt/live/spd.milestones/privkey.pem nginx/certs/spd.milestones.key

# Restart nginx
docker-compose restart nginx
```

## Monitoring

### Application Monitoring

#### Using Docker
```bash
# Resource usage
docker stats

# Container logs
docker-compose logs -f --tail=100

# Health checks
watch -n 5 'curl -s http://localhost/health'
```

#### Using Kubernetes
```bash
# Pod status
kubectl get pods -n spd-milestones -w

# Resource usage
kubectl top pods -n spd-milestones
kubectl top nodes

# Logs
kubectl logs -f deployment/backend -n spd-milestones
```

### Database Monitoring

```bash
# MongoDB stats
docker exec spd_mongo mongo spd --eval "db.stats()"

# Check collections
docker exec spd_mongo mongo spd --eval "db.getCollectionNames()"

# Document counts
docker exec spd_mongo mongo spd --eval "db.projects.countDocuments()"
```

### Recommended Monitoring Tools

1. **Prometheus + Grafana**
   - Metrics collection
   - Custom dashboards
   - Alerting

2. **ELK Stack**
   - Centralized logging
   - Log analysis
   - Search capabilities

3. **Datadog / New Relic**
   - APM
   - Infrastructure monitoring
   - Error tracking

4. **Sentry**
   - Error tracking
   - Performance monitoring
   - Release tracking

## Backup & Recovery

### Database Backup

```bash
# Manual backup
docker exec spd_mongo mongodump --out /backup --db spd

# Copy backup to host
docker cp spd_mongo:/backup ./backups/$(date +%Y%m%d)

# Automated backup (add to cron)
0 2 * * * /path/to/backup-script.sh
```

### Restore Database

```bash
# Restore from backup
docker exec -i spd_mongo mongorestore --db spd /backup/spd
```

### Application Backup

```bash
# Backup configuration
tar -czf config-backup.tar.gz docker-compose.yml .env nginx/

# Backup logs
tar -czf logs-backup.tar.gz backend/logs/
```

## Troubleshooting

### Services Not Starting

```bash
# Check logs
docker-compose logs

# Check specific service
docker-compose logs backend

# Rebuild and restart
docker-compose down
docker-compose up -d --build
```

### Database Connection Issues

```bash
# Test MongoDB connection
docker exec spd_mongo mongo --eval "db.adminCommand('ping')"

# Check network
docker network inspect spd-milestones_spd-network

# Verify environment variables
docker exec spd_backend env | grep MONGO
```

### Frontend Not Loading

```bash
# Check nginx config
docker exec spd_nginx nginx -t

# Verify frontend is running
docker exec spd_frontend ps aux

# Check browser console
# Open DevTools > Console
# Look for CSP or network errors
```

### Performance Issues

```bash
# Check resource usage
docker stats

# Check MongoDB performance
docker exec spd_mongo mongo spd --eval "db.currentOp()"

# Enable detailed logging
# Set LOG_LEVEL=debug in .env
docker-compose up -d backend
```

### Build Taking Too Long

```bash
# Use build cache
docker-compose build --parallel

# Clean build cache if needed
docker builder prune

# Use multi-stage builds (already configured)
docker-compose build --build-arg BUILDKIT_INLINE_CACHE=1
```

## Scaling Guide

### Horizontal Scaling

```bash
# Scale backend
docker-compose up -d --scale backend=3

# Scale with Kubernetes
kubectl scale deployment backend --replicas=5 -n spd-milestones
```

### Vertical Scaling

```yaml
# Update docker-compose.yml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 4G
        reservations:
          cpus: '1'
          memory: 2G
```

## Security Checklist

- [ ] Change default passwords
- [ ] Enable HTTPS
- [ ] Configure firewall
- [ ] Set up rate limiting
- [ ] Enable CORS properly
- [ ] Use secrets management
- [ ] Regular security updates
- [ ] Enable audit logging
- [ ] Implement authentication
- [ ] Set up backup encryption

# SPD Milestones Kubernetes Deployment

This directory contains Kubernetes manifests for deploying SPD Milestones on a multi-node kind cluster.

## 🎯 Overview

Deploy SPD Milestones on a local Kubernetes cluster using **kind** (Kubernetes IN Docker) with:
- **1 Control Plane Node** - Manages the cluster
- **2 Worker Nodes** - Runs application workloads
  - Worker 1: Backend tier (API services)
  - Worker 2: Frontend tier (UI)

## 📋 Prerequisites

1. **Docker Desktop** - Must be running
2. **kind** - Kubernetes IN Docker
   ```powershell
   # Install using Chocolatey
   choco install kind
   
   # Or using Scoop
   scoop install kind
   ```

3. **kubectl** - Kubernetes CLI
   ```powershell
   # Install using Chocolatey
   choco install kubernetes-cli
   
   # Or using Scoop
   scoop install kubectl
   ```

4. **Docker images built** - Run from project root:
   ```powershell
   docker-compose build
   ```

## 🚀 Quick Start

### 1. Create the Cluster

```powershell
cd k8s
.\setup-cluster.ps1
```

This script will:
- ✅ Check prerequisites
- 🏗️ Create multi-node cluster (1 control plane + 2 workers)
- 📦 Install NGINX Ingress Controller
- 📁 Create `spd-milestones` namespace
- 🎉 Display cluster information

### 2. Deploy the Application

```powershell
.\deploy-app.ps1
```

This script will:
- 📦 Load Docker images into kind cluster
- 🗄️ Deploy MongoDB (database)
- 🔧 Deploy Backend API (2 replicas)
- 🔧 Deploy GraphQL Gateway (2 replicas)
- 🎨 Deploy Frontend (2 replicas)
- 🌐 Configure Ingress routing
- ✅ Wait for all pods to be ready

### 3. Access the Application

1. **Add to hosts file** (as Administrator):
   ```
   C:\Windows\System32\drivers\etc\hosts
   ```
   Add this line:
   ```
   127.0.0.1 spd.milestones
   ```

2. **Open browser**:
   ```
   http://spd.milestones
   ```

## 📁 File Structure

```
k8s/
├── kind-config.yaml              # Multi-node cluster configuration
├── setup-cluster.ps1             # Cluster creation script
├── deploy-app.ps1                # Application deployment script
├── namespace.yaml                # Namespace definition
├── mongodb-pv.yaml               # MongoDB persistent volume
├── mongodb-deployment.yaml       # MongoDB deployment & service
├── backend-deployment.yaml       # Backend API deployment & service
├── graphql-deployment.yaml       # GraphQL deployment & service
├── frontend-deployment.yaml      # Frontend deployment & service
└── ingress.yaml                  # NGINX Ingress configuration
```

## 🛠️ Manual Deployment Steps

If you prefer manual control:

```powershell
# 1. Create cluster
kind create cluster --config kind-config.yaml

# 2. Install NGINX Ingress
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/kind/deploy.yaml

# 3. Wait for ingress controller
kubectl wait --namespace ingress-nginx `
  --for=condition=ready pod `
  --selector=app.kubernetes.io/component=controller `
  --timeout=300s

# 4. Create namespace
kubectl apply -f namespace.yaml

# 5. Load Docker images
kind load docker-image spd-milestones-backend:latest --name spd-cluster
kind load docker-image spd-milestones-graphql:latest --name spd-cluster
kind load docker-image spd-milestones-frontend:latest --name spd-cluster

# 6. Deploy services (in order)
kubectl apply -f mongodb-pv.yaml
kubectl apply -f mongodb-deployment.yaml
kubectl apply -f backend-deployment.yaml
kubectl apply -f graphql-deployment.yaml
kubectl apply -f frontend-deployment.yaml
kubectl apply -f ingress.yaml
```

## 📊 Cluster Information

### View Nodes
```powershell
kubectl get nodes -o wide
```

Expected output:
```
NAME                        STATUS   ROLES           AGE   VERSION
spd-cluster-control-plane   Ready    control-plane   5m    v1.27.0
spd-cluster-worker          Ready    <none>          4m    v1.27.0
spd-cluster-worker2         Ready    <none>          4m    v1.27.0
```

### View Deployments
```powershell
kubectl get all -n spd-milestones
```

### View Pods Distribution
```powershell
kubectl get pods -n spd-milestones -o wide
```

## 🔍 Useful Commands

### Cluster Management
```powershell
# List clusters
kind get clusters

# Get cluster info
kubectl cluster-info --context kind-spd-cluster

# Delete cluster
kind delete cluster --name spd-cluster
```

### Application Management
```powershell
# View all resources
kubectl get all -n spd-milestones

# View pods
kubectl get pods -n spd-milestones -o wide

# View services
kubectl get svc -n spd-milestones

# View ingress
kubectl get ingress -n spd-milestones
```

### Scaling
```powershell
# Scale backend
kubectl scale deployment backend --replicas=3 -n spd-milestones

# Scale frontend
kubectl scale deployment frontend --replicas=3 -n spd-milestones
```

### Logs
```powershell
# Backend logs
kubectl logs -l app=backend -n spd-milestones --tail=50 -f

# GraphQL logs
kubectl logs -l app=graphql -n spd-milestones --tail=50 -f

# Frontend logs
kubectl logs -l app=frontend -n spd-milestones --tail=50 -f

# MongoDB logs
kubectl logs -l app=mongodb -n spd-milestones --tail=50 -f
```

### Debugging
```powershell
# Describe pod
kubectl describe pod <pod-name> -n spd-milestones

# Execute command in pod
kubectl exec -it <pod-name> -n spd-milestones -- /bin/sh

# Port forward to service
kubectl port-forward svc/backend 4000:4000 -n spd-milestones
```

## 🔄 Update Deployment

After making changes to the application:

```powershell
# 1. Rebuild Docker images
docker-compose build

# 2. Load new images into kind
kind load docker-image spd-milestones-backend:latest --name spd-cluster
kind load docker-image spd-milestones-graphql:latest --name spd-cluster
kind load docker-image spd-milestones-frontend:latest --name spd-cluster

# 3. Restart deployments
kubectl rollout restart deployment backend -n spd-milestones
kubectl rollout restart deployment graphql -n spd-milestones
kubectl rollout restart deployment frontend -n spd-milestones

# 4. Check rollout status
kubectl rollout status deployment backend -n spd-milestones
```

## 🧹 Cleanup

### Delete Application Only
```powershell
kubectl delete -f . -n spd-milestones
```

### Delete Entire Cluster
```powershell
kind delete cluster --name spd-cluster
```

## ⚙️ Configuration

### Resource Limits
Each service has defined resource limits in deployment files:
- **Requests**: Guaranteed resources (256Mi RAM, 250m CPU)
- **Limits**: Maximum allowed (512Mi RAM, 500m CPU)

### Replicas
- MongoDB: 1 replica (stateful)
- Backend: 2 replicas (load balanced)
- GraphQL: 2 replicas (load balanced)
- Frontend: 2 replicas (load balanced)

### Node Affinity
- Backend & GraphQL: Scheduled on `tier=backend` worker
- Frontend: Scheduled on `tier=frontend` worker

## 🔐 Production Considerations

For production deployments, consider:

1. **Persistent Storage**: Use proper storage class (not hostPath)
2. **Secrets Management**: Use Kubernetes Secrets for sensitive data
3. **SSL/TLS**: Configure proper certificates in Ingress
4. **Resource Limits**: Adjust based on actual usage patterns
5. **Monitoring**: Add Prometheus & Grafana for observability
6. **High Availability**: Increase replica counts
7. **Auto-scaling**: Configure HPA (Horizontal Pod Autoscaler)
8. **Network Policies**: Restrict pod-to-pod communication
9. **Security Context**: Run as non-root user
10. **Health Checks**: Fine-tune probe intervals and thresholds

## 📚 Additional Resources

- [kind Documentation](https://kind.sigs.k8s.io/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [kubectl Cheat Sheet](https://kubernetes.io/docs/reference/kubectl/cheatsheet/)
- [NGINX Ingress Controller](https://kubernetes.github.io/ingress-nginx/)

## Support

- **Documentation**: See ARCHITECTURE.md
- **Issues**: GitHub Issues
- **Discussions**: GitHub Discussions
- **Email**: support@spdmilestones.com

## License

MIT License - see LICENSE file
