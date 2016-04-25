/*jshint browser: true */
function CSVLoader(config) {

    this.connector = null;

    this.dependecies = {
        mysql: require('mysql'),
        fs: require('fs'),
        csv: require('csv-streamify'),
        objectMerge: require('object-merge')
    };

    this.config = {
        database: null,
        csvPath: null,
        map: [],
        tableName: null,
        blockSize: 100,
        filter: null,

        onSuccess: function(statistics) {
            return statistics;
        }
    };

    this.validate = function() {
        var requiredAttributes =  {
            database: function(value) {
                return value !== null;
            },

            csvPath: function(value) {
                return value !== null && value.length > 0;
            },

            tableName: function(value) {
                return value !== null && value.length > 0;
            },

            map: function(value) {
                return typeof value === "object" && Object.keys(value).length > 0;
            }
        };

        for(var configName in requiredAttributes) {
            if(requiredAttributes[configName].apply(null, [this.config[configName]]) === false) {
                throw new Error("Invalid/missing config." + configName);
            }
        }
    };

    this.mergeConfigurations = function(newConfig) {
        this.config = this.dependecies
            .objectMerge(this.config, newConfig);
    };

    this.initConnection = function() {
        this.connector = this.dependecies.mysql.createConnection(
            this.config.database
        );
    };

    this.getMappedValue = function(line, dbField, mapping, parsedHeaders) {
        var finalValue = '';
        if(mapping.hasOwnProperty('field')) {
            finalValue = line[parsedHeaders[mapping.field]];

            if(mapping.hasOwnProperty('adapter')) {
                finalValue = mapping.adapter.apply(this, [finalValue, parsedHeaders, line]);
            }

        } else if(mapping.hasOwnProperty('value')) {
            finalValue = mapping.value;
        } else {
            finalValue = mapping;
        }

        return finalValue;
    };

    this.mergeConfigurations(config);
    this.validate();
    this.initConnection();
}

CSVLoader.prototype.run = function() {
    var startTime = new Date().getTime();
    var self = this;

    var parser = this.dependecies.csv({
         columns: false,
         objectMode: true,
         newline: '\r\n'
    });

    var totalRecords = 0;
    var skippedRecords = 0;
    var executionControl = 0;
    var objectBuffer = [];
    var parsedHeaders = null;
    var insertFields = Object.keys(self.config.map);
    var query = 'REPLACE INTO ' + this.config.tableName + '(' + insertFields.join(', ') + ') VALUES ?';

    parser
        .on('data', function (line) {
            if(parsedHeaders !== null) {

                totalRecords++;
                if(self.config.filter === null || self.config.filter.apply(this, [parsedHeaders, line])) {

                    executionControl++;

                    var insertObject = [];
                    for (var dbField in self.config.map) {
                        insertObject.push(self.getMappedValue(
                            line, dbField, self.config.map[dbField], parsedHeaders));
                    }

                    objectBuffer.push(insertObject);
                    if(objectBuffer.length === self.config.blockSize) {

                        self.connector.query(query, [objectBuffer.slice(0, self.config.blockSize)] , function(err) {
                            if(err) throw err;
                            executionControl -= self.config.blockSize;
                        });

                        objectBuffer = [];
                    }
                } else {
                    skippedRecords++;
                }
            } else {
                parsedHeaders = {};
                for(var i = 0; i < line.length; i++) {
                    parsedHeaders[line[i]] = i;
                }
            }
        })
        .on('end', function() {
            self.connector.query(query, [objectBuffer] , function(err) {
                if(err) throw err;
                executionControl -= objectBuffer.length;
            });

            var endInterval = setInterval(function() {
                if(executionControl === 0) {
                    clearTimeout(endInterval);
                    self.config.onSuccess.apply(self, [{
                        totalRecords: totalRecords,
                        skippedRecords: skippedRecords,
                        executionTime: new Date().getTime() - startTime
                    }]);
                }
            }, 300);
        });

    this.dependecies.fs.createReadStream(this.config.csvPath).pipe(parser);
};

module.exports = CSVLoader;
