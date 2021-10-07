const express = require('express');

const app = express();

const bodyParser = require('body-parser');

const jsonParser = bodyParser.json();

const winston = require('winston');

const logger = winston.createLogger({
  transports: [
    new winston.transports.File({
      filename: 'backend-coding-test.log',
    }),
  ],
});

const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('../docs.json');

const dbHelper = require('./db_helper');

module.exports = (db) => {
  const s = dbHelper(db);

  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

  app.get('/health', (req, res) => res.send('Healthy'));

  app.post('/rides', jsonParser, async (req, res) => {
    try {
      const startLatitude = Number(req.body.start_lat);
      const startLongitude = Number(req.body.start_long);
      const endLatitude = Number(req.body.end_lat);
      const endLongitude = Number(req.body.end_long);
      const riderName = req.body.rider_name;
      const driverName = req.body.driver_name;
      const driverVehicle = req.body.driver_vehicle;

      if (startLatitude < -90 || startLatitude > 90
            || startLongitude < -180 || startLongitude > 180) {
        return res.send({
          error_code: 'VALIDATION_ERROR',
          message: 'Start latitude and longitude must be between -90 - 90 and -180 to 180 degrees respectively',
        });
      }

      if (endLatitude < -90 || endLatitude > 90 || endLongitude < -180 || endLongitude > 180) {
        return res.send({
          error_code: 'VALIDATION_ERROR',
          message: 'End latitude and longitude must be between -90 - 90 and -180 to 180 degrees respectively',
        });
      }

      if (typeof riderName !== 'string' || riderName.length < 1) {
        return res.send({
          error_code: 'VALIDATION_ERROR',
          message: 'Rider name must be a non empty string',
        });
      }

      if (typeof driverName !== 'string' || driverName.length < 1) {
        return res.send({
          error_code: 'VALIDATION_ERROR',
          message: 'Rider name must be a non empty string',
        });
      }

      if (typeof driverVehicle !== 'string' || driverVehicle.length < 1) {
        return res.send({
          error_code: 'VALIDATION_ERROR',
          message: 'Rider name must be a non empty string',
        });
      }

      const values = [req.body.start_lat, req.body.start_long, req.body.end_lat, req.body.end_long,
        req.body.rider_name, req.body.driver_name, req.body.driver_vehicle];

      const result = await s.run('INSERT INTO Rides(startLat, startLong, endLat, endLong, riderName, driverName, driverVehicle) VALUES (?, ?, ?, ?, ?, ?, ?)', values)
        .then((insertResult) => s.all('SELECT * FROM Rides WHERE rideId=?', [insertResult.lastID]));
      logger.info({ result, values });
      return res.send(result);
    } catch (exception) {
      return res.send({
        error_code: 'SERVER_ERROR',
        message: 'Unknown error',
      });
    }
  });

  app.get('/rides', async (req, res) => {
    try {
      if (req.query.page == null || Number.isNaN(req.query.page) || req.query.page === '') {
        return res.send({
          error_code: 'VALIDATION_ERROR',
          message: 'invalid parameter: page',
        });
      }

      if (req.query.perPage == null || Number.isNaN(req.query.perPage) || req.query.perPage === '') {
        return res.send({
          error_code: 'VALIDATION_ERROR',
          message: 'invalid parameter: perPage',
        });
      }

      const page = Number(req.query.page);
      const perPage = Number(req.query.perPage);

      const result = await s.all('SELECT * FROM Rides LIMIT ? OFFSET ?', [perPage, perPage * page]);
      if (result.length === 0) {
        return res.send({
          error_code: 'RIDES_NOT_FOUND_ERROR',
          message: 'Could not find any rides',
        });
      }
      res.send(result);
    } catch (error) {
      res.send({
        error_code: 'SERVER_ERROR',
        message: 'Unknown error',
      });
    }
  });

  app.get('/rides/:id', async (req, res) => {
    try {
      const result = await s.all(`SELECT * FROM Rides WHERE rideID='${req.params.id}'`);
      if (result.length === 0) {
        return res.send({
          error_code: 'RIDES_NOT_FOUND_ERROR',
          message: 'Could not find any rides',
        });
      }
      res.send(result);
    } catch (error) {
      res.send({
        error_code: 'SERVER_ERROR',
        message: 'Unknown error',
      });
    }
  });

  return app;
};
