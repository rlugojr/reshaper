var reshaper = require('../lib/reshaper');
var expect = require('chai').expect;

describe('basic', function() {

    var schema = ['Number'];
    var genericSchema = [{
        x: 'String',
        y: 'Number'
    }];
    var data = [
        {x: 12, y: 5},
        {x: 2, y: 3},
        {x: 9, y: 14}
    ];
    var peopleData = [
        {
            name: 'Joel',
            info: {
                age: 23,
                height: 1.9,
                middleName: 'Robert',
                lastName: 'Auterson',
                twitter: '@JoelOtter',
                softwareDeveloper: true
            }
        },
        {
            name: 'Jake',
            info: {
                age: 24,
                height: 1.85,
                middleName: 'Wild',
                lastName: 'Hall',
                twitter: '@JakeWildHall',
                softwareDeveloper: false
            }
        }
    ];

    it('should return array of x values without hinting', function() {
        var result = reshaper(data, schema);
        expect(result).to.eql([12, 2, 9]);
    });

    it('should return array of y values with y hint', function() {
        var result = reshaper(data, schema, 'y');
        expect(result).to.eql([5, 3, 14]);
    });

    it('should extract ages from people data', function() {
        var result = reshaper(peopleData, schema);
        expect(result).to.eql([23, 24]);
    });

    it('should extract first names from people data', function() {
        var schema = ['String'];
        var result = reshaper(peopleData, schema);
        expect(result).to.eql(['Joel', 'Jake']);
    });

    it('should extract last names from people data', function() {
        var schema = ['String'];
        var result = reshaper(peopleData, schema, 'lastName');
        expect(result).to.eql(['Auterson', 'Hall']);
    });

    it('should handle booleans', function() {
        var schema = ['Boolean'];
        var result = reshaper(peopleData, schema);
        expect(result).to.eql([true, false]);
    });

    it('should have appropriate backoff for arrays', function() {
        var data = {
            nums: [1, 2, 3],
            strs: ['a', 'b', 'c']
        };
        var result = reshaper(data, ['String']);
        expect(result).to.eql(['a', 'b', 'c']);
    });

    it('should have appropriate backoff for objects', function() {
        var data = {
            thing: {
                a: 1,
                b: 2
            },
            other: {
                c: 'e',
                d: 'f'
            }
        };
        var schema = {one: 'String', two: 'String'};
        expect(reshaper(data, schema)).to.eql({
            one: 'e',
            two: 'f'
        });
    });

    it('should backoff even if hint is missing', function() {
        var data = {
            thing: {
                a: 1,
                b: 2
            },
            other: {
                c: 'e',
                d: 'f'
            }
        };
        var schema = {one: 'String', two: 'String'};
        expect(reshaper(data, schema, {one: 'c'})).to.eql({
            one: 'e',
            two: 'f'
        });

    });

    it('should extract arrays of simple objects from people data', function() {
        var schema = [{name: 'String', age: 'Number'}];
        var result = reshaper(peopleData, schema);
        expect(result).to.eql([
            {
                name: 'Joel',
                age: 23
            },
            {
                name: 'Jake',
                age: 24
            }
        ]);
    });

    it('should return the same data when called with a matching schema', function() {
        var schema = [
            {
                name: 'String',
                info: {
                    age: 'Number',
                    height: 'Number',
                    middleName: 'String',
                    lastName: 'String',
                    twitter: 'String',
                    softwareDeveloper: 'Boolean'
                }
            }
        ];
        var result = reshaper(peopleData, schema);
        expect(result).to.eql(peopleData);
    });

    it('should extract separate arrays into an object', function() {
        var schema = {
            age: ['Number'],
            height: ['Number']
        };
        var result = reshaper(peopleData, schema);
        expect(result).to.eql({
            age: [23, 24],
            height: [1.9, 1.85]
        });
    });

    it('should extract arrays from varying depths into object', function() {
        var schema = {
            name: ['String'],
            lastName: ['String']
        };
        var result = reshaper(peopleData, schema);
        expect(result).to.eql({
            name: ['Joel', 'Jake'],
            lastName: ['Auterson', 'Hall']
        });
    });

    it('should not matter what order the schema is in', function() {
        var schema = {
            name: ['String'],
            lastName: ['String'],
            middleName: ['String']
        };
        var result = reshaper(peopleData, schema);
        schema = {
            lastName: ['String'],
            middleName: ['String'],
            name: ['String']
        };
        var result2 = reshaper(peopleData, schema);
        expect(result2).to.eql(result);
    });

    it('should, with no hint, pick the shallowest', function() {
        var schema = ['String'];
        var result = reshaper(peopleData, schema, 'firstName');
        expect(result).to.eql(['Joel', 'Jake']);
        schema = {
            firstName: ['String'],
            lastName: ['String']
        };
        result = reshaper(peopleData, schema);
        expect(result).to.eql({
            firstName: ['Joel', 'Jake'],
            lastName: ['Auterson', 'Hall']
        });
    });

    it('should be able to construct arrays from different levels', function() {
        var rectangles = [
            {
                width: 5,
                height: 4,
                colour: {
                    red: 255,
                    green: 128,
                    blue: 0
                }
            },
            {
                width: 10,
                height: 2,
                colour: {
                    red: 50,
                    green: 90,
                    blue: 255
                }
            }
        ];
        var schema = {
            width: ['Number'],
            red: ['Number']
        };
        var result = reshaper(rectangles, schema);
        expect(result).to.eql({
            width: [5, 10],
            red: [255, 50]
        });
    });

    it('should be able to create an array from an object', function() {
        var data = {
            red: 1,
            green: 2,
            blue: 3
        };
        var schema = {
            colour: ['Number']
        };
        var result = reshaper(data, schema);
        expect(result).to.eql({
            colour: [1, 2, 3]
        });
    });

    it('should do object-array conversion on the outer elements', function() {
        var data = {
            a: 1,
            b: 2,
            cd: {
                c: 3,
                d: 4
            }
        };
        var schema = ['Number'];
        var result = reshaper(data, schema);
        expect(result).to.eql([1, 2]);
    });

    it('should allow hints to be used within objects', function() {
        var result = reshaper(peopleData, genericSchema, 'height');
        expect(result).to.eql([
            {x: 'Joel', y: 1.9},
            {x: 'Jake', y: 1.85}
        ]);
    });

    it('should allow multiple hints to be used', function() {
        var result = reshaper(peopleData, genericSchema, ['lastName', 'height']);
        expect(result).to.eql([
            {x: 'Auterson', y: 1.9},
            {x: 'Hall', y: 1.85}
        ]);
    });

    it('should fix on a used key', function() {
        var data = [{a: 1, b: 2}, {b: 3, a: 4}];
        var schema = ['Number'];
        var result = reshaper(data, schema);
        expect(result).to.eql([1, 4]);
    });

    it('should avoid using hints twice', function() {
        var schema = {
            x: ['String'],
            y: ['String']
        };
        var result = reshaper(peopleData, schema, ['lastName', 'middleName']);
        expect(result).to.eql({
            x: ['Auterson', 'Hall'],
            y: ['Robert', 'Wild']
        });
        var result = reshaper(peopleData, schema, ['middleName', 'lastName']);
        expect(result).to.eql({
            y: ['Auterson', 'Hall'],
            x: ['Robert', 'Wild']
        });
    });

    it('should throw exception if cannot create array from object', function() {
        var data = {
            a: 'a',
            b: 'b'
        };
        var schema = ['Number'];
        expect(function() {
            reshaper(data, schema)
        }).to.throw('Could not find');
    });

    it('should throw exception if cannot create array from primitive', function() {
        expect(function() {
            reshaper('a', ['Number'])
        }).to.throw('Could not find');
    });

    it('should throw exception if part of schema cannot be found', function() {
        var schema = {
            words: ['String'],
            nums: ['Number']
        };
        expect(function() {
            reshaper([1, 2, 3], schema)
        }).to.throw('Could not find');
    });

    it('should be able to backtrack multiple levels', function() {
        var data = [
            {
                name: 'Joel',
                pets: [
                    {name: 'Tony', age: 24}
                ]
            },
            {
                name: 'Jake',
                pets: [
                    {name: 'Jim', age: 12},
                    {name: 'Rico', age: 207}
                ]
            }
        ];
        var schema = {
            names: ['String'],
            ages: [{
                age: ['Number']
            }]
        };
        expect(reshaper(data, schema)).to.eql({
            names: ['Joel', 'Jake'],
            ages: [
                {age: [24]},
                {age: [12, 207]}
            ]
        });
    });

    it('should be able to backtrack from nested objects', function() {
        var schema = {
            names: ['String'],
            extra: {
                ages: ['Number']
            }
        };
        expect(reshaper(peopleData, schema)).to.eql({
            names: ['Joel', 'Jake'],
            extra: {
                ages: [23, 24]
            }
        });
    });

});
