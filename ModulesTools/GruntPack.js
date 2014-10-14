var path = require('path');

var initGruntApps = [];

var rebase = function(c, basePath){
    c.modulesUsed = path.join(basePath, c.modulesUsed);
    c.modulesApp = path.join(basePath, c.modulesApp);
    c.buildPath = path.join(basePath, c.buildPath);
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
        modulesUsed: configApp.modulesUsed,
        modulesApp: configApp.modulesApp,
        buildPath: configApp.buildPath
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

    var clean = [destinationPack, sourceMapName];

    var keys = ['getOrderFileList', 'uglify', 'clean'];

    var config = {};
    keys.forEach(function (key) {
        config[key] = {};
        config[key][appKey] = eval(key);
    });

    grunt.config.merge(config);

    grunt.registerTask(appKey + '-pack', ['getOrderFileList:' + appKey, 'uglify:' + appKey]);
    grunt.registerTask(appKey + '-clean', ['clean:' + appKey]);

    return {
        pack: appKey + '-pack',
        clean: appKey + '-clean'
    };
};
