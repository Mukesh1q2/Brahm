# Ops (Dev/CI/CD) blueprints

This folder contains example manifests and guidelines to bootstrap infrastructure. These are examples; review and adapt for your environment.

## Kubernetes (k8s)

- Namespace: brahm
- Components: frontend (Next.js), backend (API), vector-db, neo4j, ingress-nginx

### Example deployment

apiVersion: apps/v1
kind: Deployment
metadata:
  name: brahm-frontend
  namespace: brahm
spec:
  replicas: 2
  selector:
    matchLabels: { app: brahm-frontend }
  template:
    metadata:
      labels: { app: brahm-frontend }
    spec:
      containers:
        - name: web
          image: ghcr.io/you/brahm-frontend:latest
          ports: [{ containerPort: 3000 }]
          env:
            - name: NEXT_PUBLIC_FUTURISTIC_UI
              value: "true"
            - name: NEXT_PUBLIC_CANARY
              valueFrom:
                configMapKeyRef: { name: brahm-config, key: NEXT_PUBLIC_CANARY }
---
apiVersion: v1
kind: Service
metadata:
  name: brahm-frontend
  namespace: brahm
spec:
  type: ClusterIP
  selector: { app: brahm-frontend }
  ports: [{ port: 80, targetPort: 3000 }]

## gVisor/Firecracker isolation

- For Node.js pods handling untrusted input (file uploads), consider running under gVisor (GKE Sandbox) or Firecracker via Kata Containers.
- Document PodSecurityPolicy/PodSecurityStandards with seccompProfile: RuntimeDefault.

## Cost monitoring (OpenCost)

- Deploy OpenCost in the cluster; label workloads by app/component.
- Export daily spend per namespace to Prometheus/Grafana; map to Agents/Org budgets in the app.

## Automated backups

- Use Velero for cluster resource backups.
- Database backups: schedule daily dumps to object storage; test restores monthly.

## Environments

- Separate dev/staging/prod namespaces and clusters.
- Use feature flags (NEXT_PUBLIC_CANARY) for canary rollouts.


