const { S3Client } = require('@aws-sdk/client-s3');
const config = require('./env');

const s3Client = new S3Client({
  region: config.aws.region,
  credentials: {
    accessKeyId: config.aws.accessKeyId,
    secretAccessKey: config.aws.secretAccessKey
  }
});

module.exports = s3Client;
