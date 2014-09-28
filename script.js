var path = require('path'),
    minimatch = require("minimatch");
var defineModuleSolver = require('./defineModuleSolver');
var copyUsedModules = defineModuleSolver.copyUsedModules;
var injectModulesLinksToHtml = defineModuleSolver.injectModulesLinksToHtml;
var buildManualOneRootNoDependency = defineModuleSolver.buildManualOneRootNoDependency;

/*
 buildManualOneRootNoDependency('app2', ["./ModulesTools/sample/modules/*.js", "./ModulesTools/sample/app/*.js"], "./ModulesTools/sample/modules/*.js", 'samplePack', "./ModulesTools/sample/samplePack.js", function (err, data) {
 console.log(err, data);
 //process.exit();
 });
 */

// copy used from glob to destination
// inject link to html
// combine to one file


copyUsedModules('app2', ["./ModulesTools/sample/modules/*.js", "./ModulesTools/sample/app/*.js"], {}, "./ModulesTools/sample/modules/*.js", function (fromSrc) {
    var bn = path.basename(fromSrc);
    return "./ModulesTools/sample/usedModules/" + bn;
}, function (err, data) {
    console.log(err, data);
    if (err) return;

    injectModulesLinksToHtml('app2', ["./ModulesTools/sample/usedModules/*.js", "./ModulesTools/sample/app/*.js"],
        {},
        function (html, fromSrc) {
            var bn = path.basename(fromSrc);
            if (minimatch(fromSrc, "./ModulesTools/sample/usedModules/*.js")) {
                return "usedModules/" + bn;
            }
            if (minimatch(fromSrc, "./ModulesTools/sample/app/*.js")) {
                return "app/" + bn;
            }
        }, ["./ModulesTools/sample/scriptsLoad.html"], function (err, data) {
            console.log(err, data);
            process.exit();
        });
});
