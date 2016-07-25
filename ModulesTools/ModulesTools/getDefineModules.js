
var path = require('path'),
    fs = require('fs'),
    FilesSandboxAggregate = require('../SandboxRunners').FilesSandboxAggregate;

var defineModuleTemplate = "";
var loadDefineModuleTemplate = function (cb) {
    fs.readFile(__dirname + '/templates/defineModule.template.js', function (err, data) {
        if (err) throw err;
        defineModuleTemplate = data;
        cb();
    });
};
var getDefineModules = function (files, onResult) {
    if (defineModuleTemplate == "") {
        loadDefineModuleTemplate(function () {
            new FilesSandboxAggregate().runFiles(files, function (content) {
                return defineModuleTemplate.toString().replace('/*%%%*/', content);
            }, onResult)
        });
    }
    else {
        new FilesSandboxAggregate().runFiles(files, function (content) {
            return defineModuleTemplate.toString().replace('/*%%%*/', content);
        }, onResult)
    }
};

var sampleResult = [
    {
        result: [
            {
                name: 'a',
                requires: ['b'],
                factory: 'function(){}'
            }
        ],
        filePath: 'a.js'
    }
];

module.exports = getDefineModules;