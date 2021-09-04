import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";

// Create a GCP resource (Storage Bucket)
const bucket = new gcp.storage.Bucket("my-bucket", {
  website: {
    mainPageSuffix: 'index.html'
  },
  uniformBucketLevelAccess: true
});

const bucketIAMBinding = new gcp.storage.BucketIAMBinding("my-bucket-IAMBinding", {
  bucket: bucket.name,
  role: "roles/storage.objectViewer",
  members: ["allUsers"]
});

// Export the DNS name of the bucket
export const bucketName = bucket.url;

const bucketObject = new gcp.storage.BucketObject("index.html", {
  bucket: bucket.name,
  contentType: "text/html",
  source: new pulumi.asset.FileAsset("index.html")
});
export const bucketEndpoint = pulumi.concat("http://storage.googleapis.com/", bucket.name, "/", bucketObject.name);
