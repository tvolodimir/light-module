var path = require('path'),
    minimatch = require("minimatch");
var defineModuleSolver = require('./../ModulesTools');
var copyUsedModules = defineModuleSolver.copyUsedModules;
var injectModulesLinksToHtml = defineModuleSolver.injectModulesLinksToHtml;
var buildManualOneRootNoDependency = defineModuleSolver.buildManualOneRootNoDependency;

/*
 buildManualOneRootNoDependency('app2', ["./sample/modules/*.js", "./sample/app/*.js"], "./sample/modules/*.js", 'samplePack', "./sample/samplePack.js", function (err, data) {
 console.log(err, data);
 //process.exit();
 });
 */

// copy used from glob to destination
// inject link to html
// combine to one file

copyUsedModules('app2', ["./sample/modules/*.js", "./sample/app/*.js"], {}, "./sample/modules/*.js", function (fromSrc) {
    var bn = path.basename(fromSrc);
    return "./sample/usedModules/" + bn;
}, function (err, data) {
    console.log(err, data);
    if (err) return;

    injectModulesLinksToHtml('app2', ["./sample/usedModules/*.js", "./sample/app/*.js"],
        {},
        function (html, fromSrc) {
            var bn = path.basename(fromSrc);
            if (minimatch(fromSrc, "./sample/usedModules/*.js")) {
                return "usedModules/" + bn;
            }
            if (minimatch(fromSrc, "./sample/app/*.js")) {
                return "app/" + bn;
            }
        }, ["./sample/scriptsLoad.html"], function (err, data) {
            console.log(err, data);
            process.exit();
        });
});
