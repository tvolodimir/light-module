module.exports = function (grunt) {

    var path = require('path'),
        minimatch = require("minimatch");

    grunt.initConfig({
        meta: {
            modulesManager: "./ModulesTools/modulesResolverForPack.js",
            app2 : {
                rootModuleName: 'app2',
                modulesBase: "./sample/modules/*.js",
                modulesUsed: "./sample/usedModules/*.js",
                modulesApp: "./sample/app/*.js"
            }
        },
        uglify: {
            app2 :{
                options: {
                    beautify: true,
                    sourceMap: true,
                    sourceMapName: 'sample/samplePack2.map',
                    wrap:'app2',
                    selft:true
                },
                files:{
                    'sample/samplePack.min.js':'<%= meta.getOrderFileList.app2 %>'
                }
            }
        },
        copyUsedModules : {
            app2: {
                rootModuleName: '<%= meta.app2.rootModuleName %>',
                globPatternSearch: [
                    '<%= meta.app2.modulesBase %>',
                    '<%= meta.app2.modulesApp %>'
                ],
                globOptions: {},
                globPatternCopy: '<%= meta.app2.modulesBase %>',
                copyDestinationResolver: function (fromSrc) {
                    var bn = path.basename(fromSrc);
                    return "./sample/usedModules/" + bn;
                }
            }
        },
        injectModulesLinksToHtml : {
            app2: {
                rootModuleName: '<%= meta.app2.rootModuleName %>',
                globPatternSearch: [
                    '<%= meta.app2.modulesUsed %>',
                    '<%= meta.app2.modulesApp %>'
                ],
                globOptions: {},
                htmlScriptPathResolver: function (htmlPath, sriptPath) {
                    var bn = path.basename(sriptPath);
                    if (minimatch(sriptPath, "./sample/usedModules/*.js")) {
                        return "usedModules/" + bn;
                    }
                    if (minimatch(sriptPath, "./sample/app/*.js")) {
                        return "app/" + bn;
                    }
                },
                html: ["./sample/scriptsLoad.html"]
            }
        },
        getOrderFileList: {
            app2: {
                globPatternSearch: [
                    '<%= meta.app2.modulesUsed %>',
                    '<%= meta.app2.modulesApp %>'
                ],
                globOptions: {},
                rootModuleName: '<%= meta.app2.rootModuleName %>',
                globPatternCopy: [
                    '<%= meta.app2.modulesUsed %>',
                    '<%= meta.app2.modulesApp %>'
                ],
                preFiles:['<%= meta.modulesManager %>'],
                order: null
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-uglify');
    require('./ModulesTools').loadGruntTask(grunt);

    grunt.registerTask('app2', ['copyUsedModules:app2', 'injectModulesLinksToHtml:app2', 'getOrderFileList:app2', 'uglify:app2']);
    grunt.registerTask('default', ['app2']);
};
