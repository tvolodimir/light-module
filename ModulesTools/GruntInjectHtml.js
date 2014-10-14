var path = require('path');

var initGruntApps = [];

var rebase = function (c, basePath) {
    if (c.modulesUsed != undefined)
        c.modulesUsed = path.join(basePath, c.modulesUsed);

    if (c.modulesApp != undefined)
        c.modulesApp = path.join(basePath, c.modulesApp);

    if (c.orderSrc != undefined)
        c.orderSrc = path.join(basePath, c.orderSrc);

    if (c.htmls != undefined)
        c.htmls.forEach(function (item, i) {
            c.htmls[i] = path.join(basePath, c.htmls[i]);
        });
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
        htmls: configApp.htmls,
        orderResultFile: configApp.orderSrc
    };

    var injectModulesLinksToHtml = {
        rootModuleName: meta.rootModuleName,
        globPatternSearch: [
            meta.modulesUsed + '**/*.js',
            meta.modulesApp + '**/*.js'
        ],
        globOptions: {},
        htmlScriptPathResolver: function (htmlPath, scriptPath) {
            console.log(
                path.relative(path.dirname(htmlPath), path.resolve(path.dirname(htmlPath), scriptPath)),
                path.relative(path.dirname(htmlPath), scriptPath));
            return path.relative(path.dirname(htmlPath), path.resolve(path.dirname(htmlPath), scriptPath)).replace(/\\/g, '/');
        },
        html: meta.htmls,
        orderResultFile: meta.orderResultFile
    };

    var cleanModulesAtHtml = {
        globPatternSearch: meta.htmls,
        globOptions: {}
    };

    var keys = ['cleanModulesAtHtml', 'injectModulesLinksToHtml'];

    var config = {};
    keys.forEach(function (key) {
        config[key] = {};
        config[key][appKey] = eval(key);
    });

    grunt.config.merge(config);

    grunt.registerTask(appKey + '-inject', ['injectModulesLinksToHtml:' + appKey]);
    grunt.registerTask(appKey + '-clean', ['cleanModulesAtHtml:' + appKey]);

    return {
        inject: appKey + '-inject',
        clean: appKey + '-clean'
    };
};