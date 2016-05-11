# node-csv-loader [![NPM Version](https://img.shields.io/npm/v/node-csv-loader.svg)](https://npmjs.org/package/node-csv-loader)

Simple library to import a .csv into MySQL (at least for now).

## Install

From NPM:

```shell
npm install node-csv-loader
```

## Notes

- The first row of the .csv, must be the column names.
- The import only can be done to one, and only one table at a time.
- The library is going to try to *INSERT* the .csv records. OK duplicate key ** ALL THE FIELDS ARE GOING TO BE UPDATED.** (The PK only can be defined into the Table's definition).

## Usage

```js
var CSVLoader = require('node-csv-loader');
new CSVLoader({
  database: mysqlConfig,
  csvPath: 'path/to/file.csv',
  tableName: 'MySQLTableName',
  map: {
    'FieldToName1': {
      value: 'const'
    },
    'FieldToName2': 'const',
    'FieldToName3': {
      field: 'fieldNameOnCSV'
    },
    'FieldToName4': {
      field: 'fieldNameOnCSV',
      adapter: function(value) {
        return 'Demo: ' + value;
      }
    }
  },
  onSuccess: function(statistics) {
      console.dir(statistics);
  }
}).run();
```

## Setting up connections

The recommended way to establish a connection is this:

```js
var mysqlConfig = {
  host: 'example.org',
  user: 'bob',
  password: 'secret'
});
```

**CSVLoader** uses node-mysql as connection library, for advanced configuration see [felixge/node-mysql/](https://raw.githubusercontent.com/felixge/node-mysql/)

## Map configuration

The map is an object container the mapping between the .csv and MySql, where each attribute represents the database field, and the value represents:

### Constants
```js
{
  'DatabaseField1': <constant>,
  'DatabaseField2': {
    value: <constant>
  }
};
```

### CSV Fields
```js
{
  'DatabaseField1': {
    field: 'CSV Field Name'
  },
  'DatabaseField2': {
    field: 'CSV Field Name',
    adapter: function(value) {
      return 'Hello: ' + value;
    }
  }
};
```

Optionally you can add an "adapter" attribute to the field, which receives the following parameters:
- *value*: Current field value.
- *rowMap*: [Same as described below on the filter callback](#filter).
- *rowValues*: [Same as described below on the filter callback](#filter).



## Options


### blockSize
Type: `integer` | **Default: 100**

Size of the object buffer to persist into MySQL.

### filter
Type: `null|function` | **Default: null**

Callback to filter the rows loaded from the .csv. The function must return a boolean.
```js
  /*
  * @param  {columnName: index} rowMap Object containing {columnName: index}
  * loaded from .csv
  * @param  [] rowValues Array containing all the row values.
  * @return boolean Return true, if the row is valid.*/
  filter: function(rowMap, rowValues) {
    // To get an specific column value: rowValues[columnName['{fieldName}']].
    // * columnName['{fieldName}'] -> returns the index (from rowValues),
    // that matches the field.
    return rowValues[rowMap['Active']] === 'True';
  }
```

### onSuccess
Type: `null|function` | **Default: null**
Callback triggered when the import to MySQL is done.
```js
  /*
  * @param  {totalRecords: integer,
  *         skippedRecords: integer,
  *         executionTime: integer} Object with process statistics.
  */
  onSuccess: function(statistics) {
    // To get an specific column value: rowValues[columnName['{fieldName}']].
    // * columnName['{fieldName}'] -> returns the index (from rowValues),
    // that matches the field.
    console.dir(statistics);
  }
```

## Callbacks Notes

The filter & adapter function are executed into the library context, which allows you to access the configuration object, MySQL connection, dependencies, etc by using "this".

## Todos

 - Write Tests
 - Add Code Comments
 - Improve dependency management
 - Improve configuration
 - Add PK definition support
 - Improve conventions-over-configurations

## Release History

 * 2016-05-11   v1.1.0   Update package.json and better docs.
 * 2016-04-20   v1.0.0   Initial version.
