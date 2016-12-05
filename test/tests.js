var assert = require('assert');
var CSVLoader = require('../nodecsvloader.js');
var createTableQuery = "CREATE TABLE `NodeCsvLoaderTable` (`Id` INT NOT NULL COMMENT '' AUTO_INCREMENT, `FieldTypeConst` VARCHAR(45) NULL COMMENT '', `FieldTypeNameOnCSV` VARCHAR(45) NULL COMMENT '', `FieldTypeAdapter` VARCHAR(45) NULL COMMENT '', `FieldTypeConstObject` VARCHAR(45) NULL COMMENT '', PRIMARY KEY (`Id`)  COMMENT '') ENGINE = InnoDB";
var config = {
	csvPath: __dirname + '/test.csv',
	tableName: 'NodeCsvLoaderTable',
	map: {
		'FieldTypeConst': 'const',
		'FieldTypeNameOnCSV': {
			field: 'FieldTypeNameOnCSV'
		},
		'FieldTypeAdapter': {
			field: 'FieldTypeAdapter',
			adapter: function(value) {
				return '__' + value + '__';
			}
		},
		'FieldTypeConstObject': {
			value: 'constObject'
		}
	},
	filter: function(rowMap, rowValues) {
	    return rowValues[rowMap['CireteriaField']] === 'yes';
	},
	database: {
		host: '127.0.0.1',
		user: 'xckon',
		password: 'secret',
		database: 'ncl_test_database'
	}
};

describe('MappingTests', function() {

	it('Test Connection', function(done) {
		try {
			
			new CSVLoader(config).getConnection().connect(function(err) {
				done(err);
			});
			
		} catch(e) {
			done(e);
		}
	});


	var loaderInstance = new CSVLoader(config);
	var dbRows = [];
	
	before(function testTableCreation(done) {
		loaderInstance.getConnection().query(createTableQuery, function(err) {
			done(err);
		});
	});

	it('Run Loader', function(done) {
		new CSVLoader(config).run(function() {
			done()
		});
	});

	it('Test Field-Types Mapping', function() {
		
		loaderInstance.getConnection().query('SELECT * FROM NodeCsvLoaderTable', function(err, rows) {
			
			if(err) {
				throw err;
			}

			//
			// Testing filter
			// 
			assert.equal(rows.length, 1);

			//
			// Testing mapping
			//
			var mapTests = [
				{type: 'const', fieldName: 'FieldTypeConst', expected: 'const'},
				{type: 'onCsv', fieldName: 'FieldTypeNameOnCSV', expected: 'TestValue_FieldTypeNameOnCSV'},
				{type: 'adapter', fieldName: 'FieldTypeAdapter', expected: '__TestValue_FieldTypeAdapter__'},
				{type: 'constObject', fieldName: 'FieldTypeConstObject', expected: 'constObject'},
			];

			mapTests.forEach(function(test) {
				assert.equal(rows[0][test.fieldName], test.expected);
			});
		});
	});

	after(function testTableDrop(done) {
		loaderInstance.getConnection().query('DROP TABLE NodeCsvLoaderTable', function(err) {
			done(err);
		});
	});
		
});