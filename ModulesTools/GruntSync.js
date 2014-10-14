var path = require('path');

var initGruntApps = [];

var rebase = function (c, basePath) {
    c.modulesBase = path.join(basePath, c.modulesBase);
    c.modulesUsed = path.join(basePath, c.modulesUsed);
    c.modulesApp = path.join(basePath, c.modulesApp);
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
        modulesBase: configApp.modulesBase,
        modulesUsed: configApp.modulesUsed,
        modulesApp: configApp.modulesApp
    };

    var copyUsedModules = {
        rootModuleName: meta.rootModuleName,
        globPatternSearch: [
            meta.modulesBase + '**/*.js',
            meta.modulesApp + '**/*.js'
        ],
        globOptions: {},
        globPatternCopy: meta.modulesBase + '**/*.js',
        copyDestinationResolver: function (fromSrc) {
            var r = path.relative(meta.modulesBase, fromSrc);
            return path.join(meta.modulesUsed, r);
        }
    };

    var clean = [meta.modulesUsed + '**/*'];

    var config = {};
    ['copyUsedModules', 'clean'].forEach(function (key) {
        config[key] = {};
        config[key][appKey] = eval(key);
    });

    grunt.config.merge(config);

    grunt.registerTask(appKey + '-sync', ['copyUsedModules:' + appKey]);
    grunt.registerTask(appKey + '-clean', ['clean:' + appKey]);

    return {
        sync: appKey + '-sync',
        clean: appKey + '-clean'
    };
};