import orm from '../src';

describe( 'SchemaParser', function() {

  var parser;
  beforeEach( function() {
    parser = new orm.SchemaParser();
  });

  describe( '.schemaFromNode( node )', function() {
    it( 'should parse the object into an array of paths', function() {
      var schema = parser.schemaFromNode({
        foo: Number,
        bar: String
      });
      expect( schema.paths.length ).to.equal( 2 );
      expect( schema.paths[0].name ).to.equal( 'foo' );
      expect( schema.paths[0].pathType.valueType.cast ).to.be.a( 'function' );
      expect( schema.paths[1].name ).to.equal( 'bar' );
      expect( schema.paths[1].pathType.valueType.cast ).to.be.a( 'function' );
    });

    it( 'should parse empty arrays as collections of objects', function() {
      var schema = parser.schemaFromNode( [] );
      expect( schema.valueType ).to.be.instanceof( orm.CollectionSchema );
      expect( schema.valueType.collectionType.valueType.cast ).to.equal( orm.Type.any );
    });

    it( 'should parse nested objects', function() {
      var schema = parser.schemaFromNode({
        foo: {
          bar: Number,
          baz: String
        }
      });
      expect( schema.paths.length ).to.equal( 2 );
      expect( schema.paths[0].name ).to.equal( 'foo.bar' );
      expect( schema.paths[0].pathType.valueType.cast ).to.be.a( 'function' );
      expect( schema.paths[1].name ).to.equal( 'foo.baz' );
      expect( schema.paths[1].pathType.valueType.cast ).to.be.a( 'function' );
    });

    it( 'should parse nested arrays as collections of collections', function() {
      var schema = parser.schemaFromNode({
        foo: [ [ Number ] ]
      });
      expect( schema.paths.length ).to.equal( 1 );
      var foo = schema.paths[0];
      expect( foo.name ).to.equal( 'foo' );
      expect( foo.pathType.valueType ).to.be.instanceof( orm.CollectionSchema );
      expect( foo.pathType.valueType.collectionType.valueType ).to.be.instanceof( orm.CollectionSchema );
      expect( foo.pathType.valueType.collectionType.valueType.collectionType.valueType.cast ).to.be.a( 'function' );
    });

    it( 'should parse null or undefined as an object', function() {
      var schema = parser.schemaFromNode();
      expect( schema.paths.length ).to.equal( 0 );
      expect( schema.cast() ).to.eql( {} );
    });
  });

  describe( '[schema].cast( value )', function() {
    it( 'should use the schema definition to cast the value', function() {
      var schema = parser.schemaFromNode({
        foo: {
          bar: Number
        }
      });
      var obj = schema.cast();
      expect( obj ).to.eql({
        foo: {
          bar: 0
        }
      });
    });

    it( 'should create empty arrays', function() {
      var schema = parser.schemaFromNode({
        foo: [ [ Number ] ]
      });
      var obj = schema.cast();
      expect( obj ).to.eql({
        foo: []
      });

      obj = schema.cast({
        foo: [ [ '2' ] ]
      });
      expect( obj ).to.eql({
        foo: [ [ 2 ] ]
      });
    });

    it( 'should leave nulls as null when type is nullable', function() {
      var schema = parser.schemaFromNode({
        foo: orm.Type.nullable([
          [{
            bar: Number
          }]
        ])
      });
      expect( schema.paths[0].pathType.valueType.attrs.nullable ).to.equal( true );
      var obj = schema.cast();
      expect( obj ).to.eql({
        foo: null
      });
      obj = schema.cast({
        foo: [
          [{
            bar: '2'
          }]
        ]
      });
      expect( obj ).to.eql({
        foo: [
          [{
            bar: 2
          }]
        ]
      });
    });

    it( 'should convert null to the default value', function() {
      var schema = parser.schemaFromNode({
        foo: [ [ Number ] ]
      });
      var obj = schema.cast({
        foo: [ null ]
      });
      expect( obj ).to.eql({
        foo: [ [] ]
      });
    });

    it( 'should recursively call .cast() on nested schemas', function() {
      var schemaA = parser.schemaFromNode({
        foo: Number
      });
      var schemaB = parser.schemaFromNode({
        bar: {
          baz: schemaA
        }
      });
      var obj = schemaB.cast();
      expect( obj ).to.eql({
        bar: {
          baz: {
            foo: 0
          }
        }
      });
    });

    it( 'should not cast Type.any', function() {
      var Foo = parser.schemaFromNode({
        bar: null
      });
      var foo = Foo.cast( {} );
      expect( foo.bar ).to.be.null;
      foo.bar = 2;
      expect( foo.bar ).to.equal( 2 );
      foo.bar = '2';
      expect( foo.bar ).to.equal( '2' );
      foo.bar = null;
      expect( foo.bar ).to.be.null;
    });

    it( 'should cast falsey types to empty strings', function() {
      var Foo = parser.schemaFromNode({
        bar: String,
        baz: String,
        qux: String
      });
      [ 0, null, false, undefined ].forEach( function( falsey ) {
        var foo = Foo.cast({ bar: falsey });
        expect( foo.bar ).to.equal( '' );
      });
    });

    it( 'should cast to 0 instead of NaN', function() {
      var Foo = parser.schemaFromNode({
        bar: Number
      });
      var foo = Foo.cast({ bar: 'hello' });
      expect( foo.bar ).to.equal( 0 );
    });
  });
});
