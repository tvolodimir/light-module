var path = require('path');

var initGruntApps = [];

var rebase = function (c, basePath) {
    c.modulesUsed = path.join(basePath, c.modulesUsed);
    c.modulesApp = path.join(basePath, c.modulesApp);
    c.destination = path.join(basePath, c.destination);
    if (c.pathBase != undefined)
        c.pathBase = path.join(basePath, c.pathBase);
};

module.exports = function (grunt, configApp, basePath) {
    if (basePath !== undefined) {
        rebase(configApp, basePath);
    }

    var appKey = configApp.appName;

    if (initGruntApps.indexOf(appKey) > -1) {
        throw new Error(appKey + 'already built');
    }

    var meta = {
        rootModuleName: configApp.rootModuleName,
        modulesUsed: configApp.modulesUsed,
        modulesApp: configApp.modulesApp,
        destination: configApp.destination,
        pathBase: configApp.pathBase
    };

    var getOrder = {
        globPatternSearch: [
            meta.modulesUsed + '**/*.js',
            meta.modulesApp + '**/*.js'
        ],
        globOptions: {},
        rootModuleName: meta.rootModuleName,
        destination: meta.destination,
        pathBase: meta.pathBase
    };

    var clean = [meta.dependenciesOrderDestination];

    var config = {};
    ['getOrder', 'clean'].forEach(function (key) {
        config[key] = {};
        config[key][appKey] = eval(key);
    });

    grunt.config.merge(config);

    grunt.registerTask(appKey + '-order', ['getOrder:' + appKey]);
    grunt.registerTask(appKey + '-clean', ['clean:' + appKey]);

    return {
        order: appKey + '-order',
        clean: appKey + '-clean'
    };
};