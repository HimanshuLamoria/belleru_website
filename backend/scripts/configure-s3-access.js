const {
  PutBucketCorsCommand,
  PutPublicAccessBlockCommand,
  PutBucketPolicyCommand
} = require('@aws-sdk/client-s3');
const config = require('../src/config/env');
const s3Client = require('../src/config/aws');

const allowedOrigins = [
  'http://127.0.0.1:5500',
  'http://localhost:5500',
  'http://127.0.0.1:5000',
  'http://localhost:5000',
  'https://belleru-6a39f.web.app',
  'https://belleru-6a39f.firebaseapp.com',
  'https://belleru.com',
  'https://www.belleru.com'
];

async function configureBucketAccess() {
  const bucketArn = `arn:aws:s3:::${config.aws.bucket}`;

  await s3Client.send(new PutBucketCorsCommand({
    Bucket: config.aws.bucket,
    CORSConfiguration: {
      CORSRules: [
        {
          AllowedHeaders: ['*'],
          AllowedMethods: ['GET', 'HEAD'],
          AllowedOrigins: allowedOrigins,
          ExposeHeaders: ['ETag', 'Content-Type', 'Content-Length', 'Cache-Control'],
          MaxAgeSeconds: 86400
        }
      ]
    }
  }));

  await s3Client.send(new PutPublicAccessBlockCommand({
    Bucket: config.aws.bucket,
    PublicAccessBlockConfiguration: {
      BlockPublicAcls: true,
      IgnorePublicAcls: true,
      BlockPublicPolicy: false,
      RestrictPublicBuckets: false
    }
  }));
  await s3Client.send(new PutBucketPolicyCommand({
    Bucket: config.aws.bucket,
    Policy: JSON.stringify({
      Version: '2012-10-17',
      Statement: [
        {
          Sid: 'AllowPublicReadForUploadedImages',
          Effect: 'Allow',
          Principal: '*',
          Action: ['s3:GetObject'],
          Resource: [`${bucketArn}/*`]
        }
      ]
    })
  }));

  console.log(`Configured public image read and CORS for ${config.aws.bucket}`);
}

configureBucketAccess().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
