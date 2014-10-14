var path = require('path');

var initGruntApps = [];

var rebase = function(c, basePath){
    c.modulesBase = path.join(basePath, c.modulesBase);
    c.modulesUsed = path.join(basePath, c.modulesUsed);
    c.modulesApp = path.join(basePath, c.modulesApp);
    c.buildPath = path.join(basePath, c.buildPath);
    c.dependenciesOrderDestination = path.join(basePath, c.dependenciesOrderDestination);
    c.htmls.forEach(function(item, i){
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

    var banner = configApp.banner;
    var meta = {
        modulesManager: path.join(__dirname, '/templates/modulesResolverForPack.js'),
        rootModuleName: configApp.rootModuleName,
        modulesBase: configApp.modulesBase,
        modulesUsed: configApp.modulesUsed,
        modulesApp: configApp.modulesApp,
        buildPath: configApp.buildPath,
        dependenciesOrderDestination: configApp.dependenciesOrderDestination,
        htmls: configApp.htmls
    };

    var destinationPack = meta.buildPath + meta.rootModuleName + '.pack.min.js';
    var sourceMapName = meta.buildPath + meta.rootModuleName + '.pack.min.map';

    var getOrderFileList = {
        globPatternSearch: [
            meta.modulesUsed + '**/*.js',
            meta.modulesApp + '**/*.js'
        ],
        globOptions: {},
        rootModuleName: meta.rootModuleName,
        globPatternCopy: [
            meta.modulesUsed + '**/*.js',
            meta.modulesApp + '**/*.js'
        ],
        preFiles: [meta.modulesManager],
        destination: meta.dependenciesOrderDestination,
        order: null
    };

    var injectModulesLinksToHtml = {
        rootModuleName: meta.rootModuleName,
        globPatternSearch: [
            meta.modulesUsed + '**/*.js',
            meta.modulesApp + '**/*.js'
        ],
        globOptions: {},
        htmlScriptPathResolver: function (htmlPath, scriptPath) {
            return path.relative(path.dirname(htmlPath), scriptPath).replace(/\\/g, '/');
        },
        html: meta.htmls
    };

    var cleanModulesAtHtml = {
        globPatternSearch: meta.htmls,
        globOptions: {}
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

    var uglify = {
        options: {
            //beautify: true,
            banner: banner,
            sourceMap: true,
            sourceMapName: sourceMapName,
            wrap: meta.rootModuleName
        },
        files: {}
    };

    uglify.files[destinationPack] = '<%= meta.getOrderFileList.' + appKey + ' %>';

    var clean = {
        'used-modules': [meta.modulesUsed + '**/*'],
        'pack': [destinationPack, sourceMapName]
    };

    for (var key in clean) {
        if (clean.hasOwnProperty(key)) {
            clean[appKey + '-' + key] = clean[key];
        }
    }

    var keys = ['getOrderFileList', 'cleanModulesAtHtml', 'injectModulesLinksToHtml', 'copyUsedModules', 'uglify'];

    var config = {};
    keys.forEach(function (key) {
        config[key] = {};
        config[key][appKey] = eval(key);
    });
    config.clean = clean;

    grunt.config.merge(config);

    grunt.registerTask(appKey + '-sync', ['clean:' + appKey + '-used-modules', 'copyUsedModules:' + appKey]);
    grunt.registerTask(appKey + '-debug', ['cleanModulesAtHtml:' + appKey, 'injectModulesLinksToHtml:' + appKey]);
    grunt.registerTask(appKey + '-order', ['getOrderFileList:' + appKey]);
    grunt.registerTask(appKey + '-pack', ['clean:' + appKey + '-pack', 'cleanModulesAtHtml:' + appKey, 'getOrderFileList:' + appKey, 'uglify:' + appKey]);
    grunt.registerTask(appKey + '-pack-clean', ['clean:' + appKey + '-pack']);
    grunt.registerTask(appKey + '-debug-clean', ['cleanModulesAtHtml:' + appKey]);
    grunt.registerTask(appKey + '-sync-clean', ['clean:' + appKey + '-used-modules']);
};

module.exports.buildSync = require('./GruntSync');
module.exports.buildOrder = require('./GruntOrder');
module.exports.buildInjectHtml = require('./GruntInjectHtml');
module.exports.buildPack = require('./GruntPack');