var compass = require('../index');
var should  = require('should');
var assert  = require('assert');

describe('node-compass', function() {

    describe('filterRequest', function() {
        it('should exist', function() {
            should(compass).have.property('filterRequest');
        });

        it('should be a function', function() {
            should(compass.filterRequest).be.type('function');
        });

        it('should pass css pathnames', function() {
            should(compass.filterRequest({
                path : '/stylesheets/style.css'
            })).equal(true);

            should(compass.filterRequest({
                path : '/stylesheets/style.scss'
            })).equal(false);
        });

        it('should throw InvalidArgumentException when passing wrong type', function() {

            [undefined, '', true, false, 1, []].forEach(function(type) {
                assert.throws(function() {
                    compass.filterRequest(type);
                }, compass.InvalidArgumentException, 'req should be an object');
            });
        });

        it('should throw InvalidArgumentException when missing out path', function() {
            assert.throws(
                function() { compass.filterRequest({}); },
                compass.InvalidArgumentException,
                'req should have path property, which is of type string'
            );
        });

        it('should throw InvalidArgumentException when passing non-string path', function() {
            [true, false, 1, {}, []].forEach(function(type) {
                assert.throws(
                    function() { compass.filterRequest({ path : type }); },
                    compass.InvalidArgumentException,
                    'req should have path property, which is of type string'
                );
            });
        });
    });

    describe('defaults', function() {
        it('should exist as a property on compass', function() {
            should(compass).have.property('defaults');
        });

        it('should be an object', function() {
            should(compass.defaults).be.an.instanceof(Object);
        });
    });

    describe('InvalidArgumentException', function() {
        it('should be a property on compass', function() {
            should(compass).have.property('InvalidArgumentException');
        });

        it('should be a function', function() {
            should(compass.InvalidArgumentException).be.type('function');
        });
    });

    describe('buildFlagsString', function() {

        it('should exist', function() {
            should(compass).have.property('buildFlagsString');
        });

        it('should be a function', function() {
            should(compass.buildFlagsString).be.type('function');
        });

        it('should return an array', function() {
            should(compass.buildFlagsString()).be.instanceof(Array);
        });

        it('should return "compile" on blank arguments', function() {
            should(compass.buildFlagsString())
                .containEql('compile').and.be.length(1);
        });

        it('should throw InvalidArgumentException when passing wrong type', function() {
            ['', true, false, 1, []].forEach(function(type) {
                assert.throws(function() {
                    compass.buildFlagsString(type);
                }, compass.InvalidArgumentException, 'opts should be an object');
            });
        });

        it('should throw InvalidArgumentException when passing wrong type for libs', function() {
            ['', true, false, 1, {}].forEach(function(type) {
                assert.throws(function() {
                    compass.buildFlagsString({ libs : type });
                }, compass.InvalidArgumentException, 'libs should be of type array');
            });
        })

        // @todo Add tests for each flag
    });

    it('should throw an error when passing wrong type', function() {
        ['', true, false, 1, []].forEach(function(type) {
            assert.throws(function() {
                compass(type);
            }, compass.InvalidArgumentException, 'opts must be of type object');
        });
    });

    it('should throw an error when passing wrong type for filterRequest', function() {
        ['', true, false, 1, []].forEach(function(type) {
            assert.throws(function() {
                compass({ filterRequest : type });
            }, compass.InvalidArgumentException, 'opts must be of type object');
        });
    });
});