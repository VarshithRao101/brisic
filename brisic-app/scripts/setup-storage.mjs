// One-time setup for Brisic's Neon storage bucket: lets the website upload and play files
// directly (CORS). Run after creating the bucket and adding NEON_S3_* to .env:
//
//   node --env-file=.env scripts/setup-storage.mjs
//
// Needs NEON_S3_ENDPOINT, NEON_S3_REGION, NEON_S3_ACCESS_KEY_ID, NEON_S3_SECRET_ACCESS_KEY and
// optionally NEON_S3_BUCKET (default "brisic-media") and SITE_ORIGINS (comma separated).
import { GetBucketCorsCommand, PutBucketCorsCommand, S3Client } from "@aws-sdk/client-s3";

const { NEON_S3_ENDPOINT, NEON_S3_REGION, NEON_S3_ACCESS_KEY_ID, NEON_S3_SECRET_ACCESS_KEY } = process.env;
const bucket = process.env.NEON_S3_BUCKET || "brisic-media";
if (!NEON_S3_ENDPOINT || !NEON_S3_ACCESS_KEY_ID || !NEON_S3_SECRET_ACCESS_KEY) {
  console.error("Missing NEON_S3_* settings. See SETUP.md → File storage.");
  process.exit(1);
}
const origins = (process.env.SITE_ORIGINS || "https://brisic.netlify.app,http://localhost:3000").split(",").map((s) => s.trim()).filter(Boolean);

const s3 = new S3Client({
  endpoint: NEON_S3_ENDPOINT,
  region: NEON_S3_REGION || "us-east-1",
  forcePathStyle: true,
  credentials: { accessKeyId: NEON_S3_ACCESS_KEY_ID, secretAccessKey: NEON_S3_SECRET_ACCESS_KEY },
});

await s3.send(new PutBucketCorsCommand({
  Bucket: bucket,
  CORSConfiguration: {
    CORSRules: [{
      AllowedOrigins: origins,
      AllowedMethods: ["GET", "HEAD", "PUT"],
      AllowedHeaders: ["*"],
      ExposeHeaders: ["ETag", "Content-Length", "Content-Range", "Accept-Ranges"],
      MaxAgeSeconds: 3600,
    }],
  },
}));
const check = await s3.send(new GetBucketCorsCommand({ Bucket: bucket }));
console.log(`CORS set on "${bucket}" for: ${origins.join(", ")}`);
console.log(JSON.stringify(check.CORSRules, null, 2));
