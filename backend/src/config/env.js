const dotenv = require('dotenv');

dotenv.config();

const requiredEnv = [
  'JWT_SECRET',
  'ADMIN_EMAIL',
  'ADMIN_PASSWORD',
  'AWS_REGION',
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'AWS_S3_BUCKET',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_PRIVATE_KEY'
];

function getRequiredEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function buildConfig() {
  requiredEnv.forEach(getRequiredEnv);

  return {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: Number(process.env.PORT || 5000),
    apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:5000',
    corsOrigins: (process.env.FRONTEND_ORIGIN || '')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
    jwt: {
      secret: getRequiredEnv('JWT_SECRET'),
      expiresIn: process.env.JWT_EXPIRES_IN || '8h'
    },
    admin: {
      email: getRequiredEnv('ADMIN_EMAIL'),
      password: getRequiredEnv('ADMIN_PASSWORD')
    },
    aws: {
      region: getRequiredEnv('AWS_REGION'),
      accessKeyId: getRequiredEnv('AWS_ACCESS_KEY_ID'),
      secretAccessKey: getRequiredEnv('AWS_SECRET_ACCESS_KEY'),
      bucket: getRequiredEnv('AWS_S3_BUCKET'),
      publicBaseUrl: process.env.AWS_S3_PUBLIC_BASE_URL || ''
    },
    firebase: {
      projectId: getRequiredEnv('FIREBASE_PROJECT_ID'),
      clientEmail: getRequiredEnv('FIREBASE_CLIENT_EMAIL'),
      privateKey: getRequiredEnv('FIREBASE_PRIVATE_KEY').replace(/\\n/g, '\n')
    }
  };
}

module.exports = buildConfig();
