const http = require('http');
const https = require('https');
const app = require('./app');
const fs = require('fs');
const mongoose = require('mongoose');
const serverConfig = require('./params/config');

/*
const privateKey  = fs.readFileSync('/etc/ssl/node/private-key.pem', 'utf8');
const certificate = fs.readFileSync('/etc/ssl/node/cert.pem', 'utf8');
const credentials = {key: privateKey, cert: certificate};
*/

const normalizePort = val => {
  const port = parseInt(val, 10);

  if (isNaN(port)) {
    return val;
  }
  if (port >= 0) {
    return port;
  }
  return false;
};
const port = normalizePort(process.env.PORT || '3000');
app.set('port', port);

const errorHandler = error => {
  if (error.syscall !== 'listen') {
    throw error;
  }
  const address = server.address();
  const bind = typeof address === 'string' ? 'pipe ' + address : 'port: ' + port;
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges.');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use.');
      process.exit(1);
      break;
    default:
      throw error;
  }
};

const server = http.createServer(app);

server.on('error', errorHandler);
server.on('listening', () => {
  const address = server.address();
  const bind = typeof address === 'string' ? 'pipe ' + address : 'port ' + port;
  console.log('Listening on ' + bind);
});

serverConfig.connectDB().then(() => {
  console.log('Connected to MongoDB');
  server.listen(port);
}).catch(err => {
  console.error('Failed to connect to MongoDB:', err);
  process.exit(1);
});

/*
const httpsServer = https.createServer(credentials, app);

httpsServer.on('error', errorHandler);
httpsServer.on('listening', () => {
  const address = server.address();
  const bind = typeof address === 'string' ? 'pipe ' + address : 'port ' + port;
  console.log('Listening on ' + bind);
});

httpsServer.listen(8443);
*/