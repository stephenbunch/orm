import {
  SchemaParser,
  schemas
} from '../src';

describe( 'SchemaParser', function() {
  describe( '.schemaFromNode( node )', function() {
    it( 'should parse the object into an array of paths', function() {
      var parser = new SchemaParser();
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

    it( 'should parse nested objects', function() {
      var parser = new SchemaParser();
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

    it( 'should parse null or undefined as an object', function() {
      var parser = new SchemaParser();
      var schema = parser.schemaFromNode();
      expect( schema.paths.length ).to.equal( 0 );
      expect( schema.cast() ).to.eql( {} );
    });

    it( 'should use type resolvers', function() {
      var parser = new SchemaParser();
      parser.typeResolvers.set( String, Number );
      var schema = parser.schemaFromNode( String );
      expect( schema.cast( '123' ) ).to.equal( 123 );
      schema = parser.schemaFromNode([ String ]);
      expect( schema.cast([ '123' ]) ).to.eql([ 123 ]);
      schema = parser.schemaFromNode({
        foo: String
      });
      expect( schema.cast() ).to.eql({
        foo: 0
      });
    });
  });

  describe( '.clone()', function() {
    it( 'should make a copy of the parser', function() {
      var parser1 = new SchemaParser();
      parser1.typeResolvers.set( String, Number );
      var parser2 = parser1.clone();
      parser2.typeResolvers.set( String, Boolean );
      var schema1 = parser1.schemaFromNode( String );
      var schema2 = parser2.schemaFromNode( String );
      expect( schema1.cast( '123' ) ).to.equal( 123 );
      expect( schema2.cast( '123' ) ).to.equal( true );
    });
  });
});
