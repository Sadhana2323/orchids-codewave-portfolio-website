// Vercel serverless entry point
const path = require('path');

// Override __dirname so server.js resolves views/ and public/ from project root
// (not from api/ folder)
const rootDir = path.join(__dirname, '..');

// Patch require so server.js uses correct paths
process.env.PROJECT_ROOT = rootDir;

const app = require('../server');
module.exports = app;
