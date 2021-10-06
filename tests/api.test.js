'use strict';

const request = require('supertest');

const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(':memory:');

const app = require('../src/app')(db);
const buildSchemas = require('../src/schemas');

const assert = require('assert')

describe('API tests', () => {
    before((done) => {
        db.serialize((err) => {
            if (err) {
                return done(err);
            }

            buildSchemas(db);

            done();
        });
    });

    describe('GET /health', () => {
        it('should return health', (done) => {
            request(app)
                .get('/health')
                .expect('Content-Type', /text/)
                .expect(200)
                .end(done);
        });
    });

    describe('GET /rides', () => {
        beforeEach(function() {
            db.run('DELETE FROM Rides');
        });

        it('should return RIDES_NOT_FOUND_ERROR on empty data', (done) => {
            request(app)
                .get('/rides')
                .query({'page' : 0, 'perPage' : 5})
                .expect('Content-Type', /application\/json/)
                .expect(200)
                .expect(res => {
                    assert.equal(res.body.error_code, 'RIDES_NOT_FOUND_ERROR', 'error codes invalid!')
                })
                .end(done);
        });

        it('should return VALIDATION_ERROR on empty query parameter: page', (done) => {
            request(app)
                .get('/rides')
                .query({'perPage' : 5})
                .expect('Content-Type', /application\/json/)
                .expect(200)
                .expect(res => {
                    assert.equal(res.body.error_code, 'VALIDATION_ERROR', 'error codes invalid!')
                })
                .end(done);
        });

        it('should return VALIDATION_ERROR on empty query parameter: perPage', (done) => {
            request(app)
                .get('/rides')
                .query({'page' : 0})
                .expect('Content-Type', /application\/json/)
                .expect(200)
                .expect(res => {
                    assert.equal(res.body.error_code, 'VALIDATION_ERROR', 'error codes invalid!')
                })
                .end(done);
        });

        it('should return array of rides on not empty data', (done) => {
            db.run('INSERT INTO Rides(startLat, startLong, endLat, endLong, riderName, driverName, driverVehicle) VALUES (?, ?, ?, ?, ?, ?, ?)'
                , [0.0, 0.0, 0.5, 0.5, 'riderName', 'driverName', 'driverVehicle']);

            request(app)
                .get('/rides')
                .query({'page' : 0, 'perPage' : 5})
                .expect('Content-Type', /application\/json/)
                .expect(200)
                .expect(res => {
                    assert.equal(res.body.error_code, null, "error codes exist!");
                    assert.equal(res.body.length, 1, "response length mismatch!");
                    for(const property in res.body[0]){
                        assert.notEqual(res.body[0][property], null, `field ${property} is null!`)
                    }
                })
                .end(done);
        });

        it('should return RIDES_NOT_FOUND_ERROR on page exceeding the maximum number of page', (done) => {
            db.run('INSERT INTO Rides(startLat, startLong, endLat, endLong, riderName, driverName, driverVehicle) VALUES (?, ?, ?, ?, ?, ?, ?)'
                , [0.0, 0.0, 0.5, 0.5, 'riderName', 'driverName', 'driverVehicle']);

            request(app)
                .get('/rides')
                .query({'page' : 1, 'perPage' : 5})
                .expect('Content-Type', /application\/json/)
                .expect(200)
                .expect(res => {
                    assert.equal(res.body.error_code, 'RIDES_NOT_FOUND_ERROR', "response length mismatch!");
                })
                .end(done);
        });
    });


    describe('GET /rides/:id', ()=> {
        beforeEach(function() {
            db.run('DELETE FROM Rides');
            db.run(`DELETE FROM sqlite_sequence WHERE name='Rides'`);
        });

        it('should return RIDES_NOT_FOUND_ERROR on empty data', (done) => {
            request(app)
                .get('/rides/1')
                .expect('Content-Type', /application\/json/)
                .expect(200)
                .expect(res => {
                    assert.equal(res.body.error_code, 'RIDES_NOT_FOUND_ERROR', 'error codes invalid!');
                })
                .end(done);
        });

        it('should return rides detail existing data', (done) => {
            db.run('INSERT INTO Rides(startLat, startLong, endLat, endLong, riderName, driverName, driverVehicle) VALUES (?, ?, ?, ?, ?, ?, ?)'
                , [0.0, 0.0, 0.5, 0.5, 'riderName', 'driverName', 'driverVehicle']);

            request(app)
                .get('/rides/1')
                .expect('Content-Type', /application\/json/)
                .expect(200)
                .expect(res => {
                    assert.equal(res.body.error_code, null, "error codes exist!");
                    for(const property in res.body[0]){
                        assert.notEqual(res.body[0][property], null, `field ${property} is null!`)
                    }
                })
                .end(done);
        });

    });

    describe('POST /rides', ()=>{
       beforeEach(()=> {
           db.run('DELETE FROM Rides');
       })

        it('should return VALIDATION_ERROR on input mismatch for start_latitude', (done)=> {
           request(app)
               .post('/rides')
               .send({
                   'start_lat': -91.0,
                   'start_long': 0.0,
                   'end_lat': 0.5,
                   'end_long': 0.5,
                   'rider_name': 'riderName',
                   'driver_name': 'driverName',
                   'driver_vehicle': 'driverVehicle'
               })
               .expect(200)
               .expect(res => {
                   assert.equal(res.body.error_code, 'VALIDATION_ERROR', 'error codes invalid!');
               })
               .end(done);
        });

        it('should return VALIDATION_ERROR on input mismatch for start_longitude', (done)=> {
            request(app)
                .post('/rides')
                .send({
                    'start_lat': 0.0,
                    'start_long': -181.0,
                    'end_lat': 0.5,
                    'end_long': 0.5,
                    'rider_name': 'riderName',
                    'driver_name': 'driverName',
                    'driver_vehicle': 'driverVehicle'
                })
                .expect(200)
                .expect(res => {
                    assert.equal(res.body.error_code, 'VALIDATION_ERROR', 'error codes invalid!');
                })
                .end(done);
        });

        it('should return VALIDATION_ERROR on input mismatch for end_latitude', (done)=> {
            request(app)
                .post('/rides')
                .send({
                    'start_lat': 0.0,
                    'start_long': 0.0,
                    'end_lat': -91.0,
                    'end_long': 0,
                    'rider_name': 'riderName',
                    'driver_name': 'driverName',
                    'driver_vehicle': 'driverVehicle'
                })
                .expect(200)
                .expect(res => {
                    assert.equal(res.body.error_code, 'VALIDATION_ERROR', 'error codes invalid!');
                })
                .end(done);
        });

        it('should return VALIDATION_ERROR on input mismatch for end_longitude', (done)=> {
            request(app)
                .post('/rides')
                .send({
                    'start_lat': 0.0,
                    'start_long': 0.0,
                    'end_lat': 0.0,
                    'end_long': -181.0,
                    'rider_name': 'riderName',
                    'driver_name': 'driverName',
                    'driver_vehicle': 'driverVehicle'
                })
                .expect(200)
                .expect(res => {
                    assert.equal(res.body.error_code, 'VALIDATION_ERROR', 'error codes invalid!');
                })
                .end(done);
        });

        it('should return VALIDATION_ERROR on input mismatch for rider_name', (done)=> {
            request(app)
                .post('/rides')
                .send({
                    'start_lat': 0.0,
                    'start_long': 0.0,
                    'end_lat': 0.5,
                    'end_long': 0.5,
                    'driver_name': 'driverName',
                    'driver_vehicle': 'driverVehicle'
                })
                .expect(200)
                .expect(res => {
                    assert.equal(res.body.error_code, 'VALIDATION_ERROR', 'error codes invalid!');
                })
                .end(done);
        });

        it('should return VALIDATION_ERROR on input mismatch for driver_name', (done)=> {
            request(app)
                .post('/rides')
                .send({
                    'start_lat': 0.0,
                    'start_long': 0.0,
                    'end_lat': 0.5,
                    'end_long': 0.5,
                    'rider_name': 'riderName',
                    'driver_vehicle': 'driverVehicle'
                })
                .expect(200)
                .expect(res => {
                    assert.equal(res.body.error_code, 'VALIDATION_ERROR', 'error codes invalid!');
                })
                .end(done);
        });

        it('should return VALIDATION_ERROR on input mismatch for driver_vehicle', (done)=> {
            request(app)
                .post('/rides')
                .send({
                    'start_lat': 0.0,
                    'start_long': 0.0,
                    'end_lat': 0.5,
                    'end_long': 0.5,
                    'rider_name': 'riderName',
                    'driver_name': 'driverName'
                })
                .expect(200)
                .expect(res => {
                    assert.equal(res.body.error_code, 'VALIDATION_ERROR', 'error codes invalid!');
                })
                .end(done);
        });

        it('should return success and correct data on correct input', (done)=> {
            request(app)
                .post('/rides')
                .send({
                    'start_lat': 0.0,
                    'start_long': 0.0,
                    'end_lat': 0.5,
                    'end_long': 0.5,
                    'rider_name': 'riderName',
                    'driver_name': 'driverName',
                    'driver_vehicle': 'driverVehicle'
                })
                .expect(200)
                .expect(res => {
                    assert.equal(res.body.error_code, null, "error codes exist!");
                    for(const property in res.body[0]){
                        assert.notEqual(res.body[0][property], null, `field ${property} is null!`)
                    }
                })
                .end(done);
        });

    });
});