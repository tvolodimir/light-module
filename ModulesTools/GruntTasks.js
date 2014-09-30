module.exports = function (grunt) {
    var moduleTools = require('./moduleTools');
    var getOrderFileList = moduleTools.getOrderFileList;

    grunt.registerMultiTask('getOrderFileList', 'Get ordered files list', function () {
        var data = this.data,
            target = this.target;
        var done = this.async();
        getOrderFileList(data.globPatternSearch, data.globOptions, data.rootModuleName, data.globPatternCopy,
            function (err, result) {
                var r = [], i;
                for (i = 0; i < data.preFiles.length; i++) {
                    r.push(data.preFiles[i]);
                }
                for (i = 0; i < result.length; i++) {
                    r.push(result[i]);
                }
                data.order = r;
                grunt.config.set('meta.getOrderFileList.' + target, r);
                grunt.log.writeln('getOrderFileList', err, r);
                done(err);
            });
    });

    var copyUsedModules = moduleTools.copyUsedModules;

    grunt.registerMultiTask('copyUsedModules', 'copy used modules', function () {
        var data = this.data,
            target = this.target;
        var done = this.async();
        copyUsedModules(data.rootModuleName, data.globPatternSearch, data.globOptions, data.globPatternCopy,
            data.copyDestinationResolver,
            function (err, result) {
                grunt.log.writeln('copyUsedModules', err, result);
                done(err);
            });
    });

    var injectModulesLinksToHtml = moduleTools.injectModulesLinksToHtml;

    grunt.registerMultiTask('injectModulesLinksToHtml', 'inject modules links to html files', function () {
        var data = this.data,
            target = this.target;
        var done = this.async();
        injectModulesLinksToHtml(data.rootModuleName, data.globPatternSearch, data.globOptions,
            data.htmlScriptPathResolver, data.html,
            function (err, result) {
                grunt.log.writeln('injectModulesLinksToHtml', err, result);
                done(err);
            });
    });

    var cleanModulesAtHtml = moduleTools.cleanModulesAtHtml;

    grunt.registerMultiTask('cleanModulesAtHtml', 'clean Modules At Html files', function () {
        var data = this.data;
        var done = this.async();
        cleanModulesAtHtml(data.globPatternSearch, data.globOptions,
            function (err, result) {
                grunt.log.writeln('cleanModulesAtHtml', err, result);
                done(err);
            });
    });
};