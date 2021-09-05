import * as k8s from '@pulumi/kubernetes';
import * as pulumi from '@pulumi/pulumi';
import * as gcp from '@pulumi/gcp';

const name = 'helloworld';

// Create a GKE cluster
const engineVersion = gcp.container.getEngineVersions().then((v) => v.latestMasterVersion);
const cluster = new gcp.container.Cluster(name, {
  initialNodeCount: 2,
  minMasterVersion: engineVersion,
  nodeVersion: engineVersion,
  nodeConfig: {
    machineType: 'n1-standard-1',
    oauthScopes: [
      'https://www.googleapis.com/auth/compute',
      'https://www.googleapis.com/auth/devstorage.read_only',
      'https://www.googleapis.com/auth/logging.write',
      'https://www.googleapis.com/auth/monitoring',
    ],
  },
});

// Export the Cluster name
export const clusterName = cluster.name;

// Manufacture a GKE-style kubeconfig. Note that this is slightly "different"
// because of the way GKE requires gcloud to be in the picture for cluster
// authentication (rather than using the client cert/key directly).
export const kubeconfig = pulumi
  .all([cluster.name, cluster.endpoint, cluster.masterAuth])
  .apply(([name, endpoint, masterAuth]) => {
    const context = `${gcp.config.project}_${gcp.config.zone}_${name}`;
    return `apiVersion: v1
clusters:
- cluster:
    certificate-authority-data: ${masterAuth.clusterCaCertificate}
    server: https://${endpoint}
  name: ${context}
contexts:
- context:
    cluster: ${context}
    user: ${context}
  name: ${context}
current-context: ${context}
kind: Config
preferences: {}
users:
- name: ${context}
  user:
    auth-provider:
      config:
        cmd-args: config config-helper --format=json
        cmd-path: gcloud
        expiry-key: '{.credential.token_expiry}'
        token-key: '{.credential.access_token}'
      name: gcp
`;
  });

// Create a Kubernetes provider instance that uses our cluster from above.
const clusterProvider = new k8s.Provider(name, { kubeconfig });

const ns = new k8s.core.v1.Namespace(name, {}, { provider: clusterProvider });
export const namespaceName = ns.metadata.apply((m) => m.name);

const appLabels = { appClass: name };
const deployment = new k8s.apps.v1.Deployment(
  name,
  {
    metadata: {
      namespace: namespaceName,
      labels: appLabels,
    },
    spec: {
      replicas: 1,
      selector: { matchLabels: appLabels },
      template: {
        metadata: {
          labels: appLabels,
        },
        spec: {
          containers: [
            {
              name: name,
              image: 'sisisin/try-pulumi:latest',
              ports: [{ name: 'http', containerPort: 80 }],
              env: [{ name: 'PORT', value: '80' }],
            },
          ],
        },
      },
    },
  },
  {
    provider: clusterProvider,
  },
);

export const deploymentName = deployment.metadata.apply((m) => m.name);

const service = new k8s.core.v1.Service(
  name,
  {
    metadata: {
      labels: appLabels,
      namespace: namespaceName,
    },
    spec: {
      type: 'LoadBalancer',
      ports: [{ port: 80, targetPort: 'http' }],
      selector: appLabels,
    },
  },
  {
    provider: clusterProvider,
  },
);
