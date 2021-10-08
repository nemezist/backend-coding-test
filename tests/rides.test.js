'use strict';

const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(':memory:');

const dbHelper = require('../src/db_helper')(db);

const buildSchemas = require('../src/schemas');

const assert = require('assert')
const winston = require("winston");

const logger = winston.createLogger({
    transports: [
        new winston.transports.Console,
    ],
});


const rideService = require('../src/service/rides')(dbHelper);

class DummyResponse {
    constructor() {
        this.content = null;
    }

    send(params) {
        this.content = params;
    }
}

describe('Rides Service tests', () => {
    before((done) => {
        db.serialize((err) => {
            if (err) {
                return done(err);
            }

            buildSchemas(db);

            done();
        });
    });

    describe('GET /rides:id', () => {
        beforeEach(async function() {
            try {
                await dbHelper.run('DELETE FROM Rides');
            }catch(exception){
                logger.error(exception);
            }
        });

        it('should return RIDES_NOT_FOUND_ERROR on empty data', async () => {
            const r = new DummyResponse();
            await rideService.getRidesById({
                'params': {
                    id : '1'
                }
            }, r);

            assert.notEqual(r.content.error_code, null);
            assert.equal(r.content.error_code, 'RIDES_NOT_FOUND_ERROR', 'error codes invalid!');
        });

        it('should return rides detail existing data', async () => {
            const r = new DummyResponse();
            const {lastID} =await dbHelper.run('INSERT INTO Rides(startLat, startLong, endLat, endLong, riderName, driverName, driverVehicle) VALUES (?, ?, ?, ?, ?, ?, ?)'
                , [0.0, 0.0, 0.5, 0.5, 'riderName', 'driverName', 'driverVehicle']);

            await rideService.getRidesById({
                'params': {
                    id : lastID
                }
            }, r);

            assert.equal(r.content.error_code, null);
            for(const property in r.content[0]){
                assert.notEqual(r.content[0][property], null, `field ${property} is null!`)
            }
        });

    });

    describe('GET /rides', () => {
        beforeEach(async () => {
            try {
                await dbHelper.run('DELETE FROM Rides');
            }catch(exception){
                logger.error(exception);
            }
        });

        it('should return RIDES_NOT_FOUND_ERROR on empty data', async () => {
            const r = new DummyResponse();
            await rideService.getAllRides({
                'query': {
                    'page' : 0,
                    'perPage' : 5
                }
            }, r);

            assert.notEqual(r.content.error_code, null);
            assert.equal(r.content.error_code, 'RIDES_NOT_FOUND_ERROR', 'error codes invalid!');
        });

        it('should return VALIDATION_ERROR on empty query parameter: page', async () => {
            const r = new DummyResponse();
            await rideService.getAllRides({
                'query': {
                    'perPage' : 5
                }
            }, r);

            assert.notEqual(r.content.error_code, null);
            assert.equal(r.content.error_code, 'VALIDATION_ERROR', 'error codes invalid!');
        });

        it('should return VALIDATION_ERROR on empty query parameter: perPage', async () => {
            const r = new DummyResponse();
            await rideService.getAllRides({
                'query': {
                    'page' : 0
                }
            }, r);

            assert.notEqual(r.content.error_code, null);
            assert.equal(r.content.error_code, 'VALIDATION_ERROR', 'error codes invalid!');
        });

        it('should return array of rides on not empty data', async () => {
            await dbHelper.run('INSERT INTO Rides(startLat, startLong, endLat, endLong, riderName, driverName, driverVehicle) VALUES (?, ?, ?, ?, ?, ?, ?)'
                , [0.0, 0.0, 0.5, 0.5, 'riderName', 'driverName', 'driverVehicle']);

            const r = new DummyResponse();
            await rideService.getAllRides({
                'query': {
                    'page' : 0,
                    'perPage' : 5
                }
            }, r);

            assert.equal(r.content.error_code, null, "error codes exist!");
            assert.equal(r.content.length, 1, "response length mismatch!");
            for(const property in r.content[0]){
                assert.notEqual(r.content[0][property], null, `field ${property} is null!`)
            }
        });

        it('should return RIDES_NOT_FOUND_ERROR on page exceeding the maximum number of page', async () => {
            await dbHelper.run('INSERT INTO Rides(startLat, startLong, endLat, endLong, riderName, driverName, driverVehicle) VALUES (?, ?, ?, ?, ?, ?, ?)'
                , [0.0, 0.0, 0.5, 0.5, 'riderName', 'driverName', 'driverVehicle']);

            const r = new DummyResponse();
            await rideService.getAllRides({
                'query': {
                    'page' : 1,
                    'perPage' : 5
                }
            }, r);

            assert.equal(r.content.error_code, 'RIDES_NOT_FOUND_ERROR', "response length mismatch!");
        });
    });

    describe('POST /rides', () => {
        it('should return VALIDATION_ERROR on input mismatch for start_latitude', async ()=>{
            const r = new DummyResponse();
            await rideService.insertRides({
                'body': {
                    'start_lat': -91.0,
                    'start_long': 0.0,
                    'end_lat': 0.5,
                    'end_long': 0.5,
                    'rider_name': 'riderName',
                    'driver_name': 'driverName',
                    'driver_vehicle': 'driverVehicle'
                }
            }, r);

            assert.notEqual(r.content.error_code, null);
            assert.equal(r.content.error_code, 'VALIDATION_ERROR', 'error codes invalid!');
        });

        it('should return VALIDATION_ERROR on input mismatch for start_longitude', async ()=>{
            const r = new DummyResponse();
            await rideService.insertRides({
                'body': {
                    'start_lat': 0.0,
                    'start_long': -181.0,
                    'end_lat': 0.5,
                    'end_long': 0.5,
                    'rider_name': 'riderName',
                    'driver_name': 'driverName',
                    'driver_vehicle': 'driverVehicle'
                }
            }, r);

            assert.notEqual(r.content.error_code, null);
            assert.equal(r.content.error_code, 'VALIDATION_ERROR', 'error codes invalid!');
        });

        it('should return VALIDATION_ERROR on input mismatch for end_latitude', async ()=>{
            const r = new DummyResponse();
            await rideService.insertRides({
                'body': {
                    'start_lat': 0.0,
                    'start_long': 0.0,
                    'end_lat': -91.0,
                    'end_long': 0.5,
                    'rider_name': 'riderName',
                    'driver_name': 'driverName',
                    'driver_vehicle': 'driverVehicle'
                }
            }, r);

            assert.notEqual(r.content.error_code, null);
            assert.equal(r.content.error_code, 'VALIDATION_ERROR', 'error codes invalid!');
        });

        it('should return VALIDATION_ERROR on input mismatch for end_longitude', async ()=>{
            const r = new DummyResponse();
            await rideService.insertRides({
                'body': {
                    'start_lat': 0.0,
                    'start_long': 0.0,
                    'end_lat': 0.5,
                    'end_long': -181.0,
                    'rider_name': 'riderName',
                    'driver_name': 'driverName',
                    'driver_vehicle': 'driverVehicle'
                }
            }, r);

            assert.notEqual(r.content.error_code, null);
            assert.equal(r.content.error_code, 'VALIDATION_ERROR', 'error codes invalid!');
        });

        it('should return VALIDATION_ERROR on input mismatch for rider_name', async ()=>{
            const r = new DummyResponse();
            await rideService.insertRides({
                'body': {
                    'start_lat': 0.0,
                    'start_long': 0.0,
                    'end_lat': 0.5,
                    'end_long': 0.5,
                    'driver_name': 'driverName',
                    'driver_vehicle': 'driverVehicle'
                }
            }, r);

            assert.notEqual(r.content.error_code, null);
            assert.equal(r.content.error_code, 'VALIDATION_ERROR', 'error codes invalid!');
        });

        it('should return VALIDATION_ERROR on input mismatch for driver_name', async ()=>{
            const r = new DummyResponse();
            await rideService.insertRides({
                'body': {
                    'start_lat': 0.0,
                    'start_long': 0.0,
                    'end_lat': 0.5,
                    'end_long': 0.5,
                    'rider_name': 'riderName',
                    'driver_vehicle': 'driverVehicle'
                }
            }, r);

            assert.notEqual(r.content.error_code, null);
            assert.equal(r.content.error_code, 'VALIDATION_ERROR', 'error codes invalid!');
        });

        it('should return VALIDATION_ERROR on input mismatch for driver_vehicle', async ()=>{
            const r = new DummyResponse();
            await rideService.insertRides({
                'body': {
                    'start_lat': 0.0,
                    'start_long': 0.0,
                    'end_lat': 0.5,
                    'end_long': 0.5,
                    'rider_name': 'riderName',
                    'driver_name': 'driverName',
                }
            }, r);

            assert.notEqual(r.content.error_code, null);
            assert.equal(r.content.error_code, 'VALIDATION_ERROR', 'error codes invalid!');
        });

        it('should return success and correct data on correct input', async ()=>{
            const r = new DummyResponse();
            await rideService.insertRides({
                'body': {
                    'start_lat': 0.0,
                    'start_long': 0.0,
                    'end_lat': 0.5,
                    'end_long': 0.5,
                    'rider_name': 'riderName',
                    'driver_name': 'driverName',
                    'driver_vehicle': 'driverVehicle'
                }
            }, r);

            assert.equal(r.content.error_code, null, "error codes exist!");
            for(const property in r.content[0]){
                assert.notEqual(r.content[0][property], null, `field ${property} is null!`)
            }
        });
    });
});