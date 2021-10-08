const express = require('express');

const app = express();

const bodyParser = require('body-parser');

const jsonParser = bodyParser.json();

const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('../docs.json');

const dbHelper = require('./db_helper');

const ridesService = require('./service/rides');

const userAgentMiddleware = require('./middleware/user-agent-checker.middleware');

module.exports = (db) => {
  const s = dbHelper(db);

  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

  app.get('/health', (req, res) => res.send('Healthy'));

  app.post('/rides', userAgentMiddleware, jsonParser, ridesService(s).insertRides);

  app.get('/rides', userAgentMiddleware, ridesService(s).getAllRides);

  app.get('/rides/:id', userAgentMiddleware, ridesService(s).getRidesById);

  return app;
};
