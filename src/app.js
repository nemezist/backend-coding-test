const express = require('express');

const app = express();

const bodyParser = require('body-parser');

const jsonParser = bodyParser.json();

const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('../docs.json');

const dbHelper = require('./db_helper');

const ridesService = require('./service/rides');

module.exports = (db) => {
  const s = dbHelper(db);

  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

  app.get('/health', (req, res) => res.send('Healthy'));

  app.post('/rides', jsonParser, ridesService(s).insertRides);

  app.get('/rides', ridesService(s).getAllRides);

  app.get('/rides/:id', ridesService(s).getRidesById);

  return app;
};
