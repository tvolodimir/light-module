var utils = require('./utils');
var arrayAction = utils.arrayAction;
var replaceRangeInFile = utils.replaceRangeInFile;
var globArray = utils.globArray;
var topologicalSortingDAG = utils.topologicalSortingDAG;
var copyFiles = utils.copyFiles;

var path = require('path'),
    fs = require('fs'),
    minimatch = require("minimatch"),
    FilesSandboxAggregate = require('./FileSandbox.js').FilesSandboxAggregate;

var defineModuleTemplate = "";
var loadDefineModuleTemplate = function (cb) {
    fs.readFile(__dirname + '/templates/defineModule.js', function (err, data) {
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
var getDefineModulesByGlob = function (globPatternSearch, globOptions, cb) {
    globArray(globPatternSearch, globOptions, function (er, files) {
        if (er) {
            cb(er);
            return;
        }
        //console.log('files', files);

        getDefineModules(files, cb);
    });
};

var p = [
    {
        result: [
            {name: 'a'}
        ],
        filePath: 'a.js'
    }
];
var aggregateDefines = function (processedItems) {
    var allDefines = {};
    for (var j = 0; j < processedItems.length; j++) {
        var defines = processedItems[j].result;
        var filePath = processedItems[j].filePath;
        if (defines instanceof Array) {
            for (var i = 0; i < defines.length; i++) {
                var define = defines[i];
                define.src = filePath;
                if (allDefines[define.name] !== undefined) {
                    throw new Error('Duplicate of defined module name: "' + define.name + '" at "' + filePath + '" and at "' + allDefines[define.name].src + '"');
                }
                allDefines[define.name] = define;
            }
        }
    }
    return allDefines;
};

/** buildManualOneRootNoDependency **/

var packs1root0outerManualTemplate = "";
var loadPacks1root0outerManualTemplate = function (cb) {
    if (packs1root0outerManualTemplate == "") {
        fs.readFile(__dirname + '/templates/manualRunOneRootPack.js', function (err, data) {
            if (err) throw err;
            packs1root0outerManualTemplate = data;
            cb(packs1root0outerManualTemplate);
        });
    }
    else {
        cb(packs1root0outerManualTemplate);
    }
};
var buildSimpleScriptNonAutoRunOneRootModule = function (modules, objectName, cb) {
    loadPacks1root0outerManualTemplate(function (template) {
        var script = template.toString();
        script = script.replace('/*%ExposePackName%*/', objectName);
        var modulesText = '\n';
        for (var i = 0; i < modules.length; i++) {
            if (i > 0) modulesText += ',\n';
            var m = modules[i];
            modulesText += '["' + m.name + '",' + JSON.stringify(m.requires) + ',' + m.factory + ']';
        }
        modulesText += '\n';
        script = script.replace('/*%Modules%*/', modulesText);
        cb(script);
    });
};
var buildManualOneRootNoDependency = function (rootModuleName, globPatternSearch, globPatternCombine, packName, destination, cb) {
    getDefineModulesByGlob(globPatternSearch, {}, function (er, processedItems) {
        if (er) {
            cb(er);
            return;
        }

        var defines = aggregateDefines(processedItems);

        var order = topologicalSortingDAG([rootModuleName], function (name) {
            var m = defines[name];
            return m ? m.requires : null;
        }, function (name) {
            return false;
        }, []);

        var modules = [];
        if (!Array.isArray(globPatternCombine)) {
            globPatternCombine = [globPatternCombine];
        }
        for (var i = 0; i < order.length; i++) {
            for (var j = 0; j < globPatternCombine.length; j++) {
                if (minimatch(defines[order[i]].src, globPatternCombine[j])) {
                    console.log('add', defines[order[i]].src);
                    modules.push(defines[order[i]]);
                }
            }
            //modules.push(defines[order[i]]);
        }

        buildSimpleScriptNonAutoRunOneRootModule(modules, packName, function (text) {
            fs.writeFile(destination, text, function (err) {
                if (err) {
                    cb(er);
                } else {
                    cb(null, 'The file was saved!');
                }
            });
        });
    });
};

/** injectModulesLinksToHtml **/

var replaceContent = function (filesPath, startMark, endMark, contentBuilder, cbResult) {
    arrayAction(filesPath, function (filePath, nextCb) {
        replaceRangeInFile(filePath, startMark, endMark, contentBuilder(filePath), function (err) {
            if (err === undefined) {
                nextCb();
            }
            else {
                cbResult(er);
            }
        });
    }, cbResult);
};
var cleanModulesAtHtml = function (globPatternSearch, globOptions, cb) {
    globArray(globPatternSearch, globOptions, function (er, files) {
        if (er) {
            cb(er);
            return;
        }
        replaceContent(files, '<!--ModulesStart-->', '<!--ModulesEnd-->', function () {
            return ""
        }, cb);
    });
};
var scriptInjectTemplate = '<script src="/*%ScriptPath%*/"></script>';
var injectHtmlScripts = function (defines, order, htmlPaths, htmlScriptPathResolver, cbResult) {
    replaceContent(htmlPaths, '<!--ModulesStart-->', '<!--ModulesEnd-->', function (htmlPath) {
        var text = "\n";
        var srcs = [];
        for (var i = 0; i < order.length; i++) {
            var src = defines[order[i]].src;
            if (srcs.indexOf(src) == -1) {
                srcs.push(src);
                var s = htmlScriptPathResolver(htmlPath, src);
                if (s)
                    text += scriptInjectTemplate.replace('/*%ScriptPath%*/', s) + '\n';
            }
        }
        return text;
    }, cbResult);
};
var injectHtmlScriptsByResultJson = function (orderResult, htmlPaths, htmlScriptPathResolver, cbResult) {
    replaceContent(htmlPaths, '<!--ModulesStart-->', '<!--ModulesEnd-->', function (htmlPath) {
        var text = "\n";
        var srcs = [];
        for (var i = 0; i < orderResult.order.length; i++) {
            var src = orderResult.order[i].src;
            if (srcs.indexOf(src) == -1) {
                srcs.push(src);
                var s = htmlScriptPathResolver(htmlPath, src);
                if (s)
                    text += scriptInjectTemplate.replace('/*%ScriptPath%*/', s) + '\n';
            }
        }
        return text;
    }, cbResult);
};
var injectModulesLinksToHtml = function (rootModuleName, globPatternSearch, globOptions, htmlScriptPathResolver, htmls, cb, orderResultFile) {
    if (orderResultFile !== undefined) {
        fs.readFile(orderResultFile, function (err, data) {
            if (err) {
                cb(err);
                return;
            }
            injectHtmlScriptsByResultJson(JSON.parse(data), htmls, htmlScriptPathResolver, function (err, result) {
                if (err) {
                    cb(err);
                    return;
                }
                cb(null, '[injectModulesLinksToHtml] done');
            });
        });

        return;
    }
    getDefineModulesByGlob(globPatternSearch, globOptions, function (er, processedItems) {
        if (er) {
            cb(er);
            return;
        }

        var defines = aggregateDefines(processedItems);

        var order = topologicalSortingDAG([rootModuleName], function (name) {
            var m = defines[name];
            return m ? m.requires : null;
        }, function (name) {
            return false;
        }, []);

        injectHtmlScripts(defines, order, htmls, htmlScriptPathResolver, function (err, result) {
            if (err) {
                cb(err);
                return;
            }
            cb(null, '[injectModulesLinksToHtml] done');
        });
    });
};

/* copyUsedModules */

var copyUsedModules = function (rootModuleName, globPatternSearch, globOptions, globPatternCopy, copyDestinationResolver, cb) {
    getDefineModulesByGlob(globPatternSearch, globOptions, function (er, processedItems) {
        if (er) {
            cb(er);
            return;
        }

        var defines = aggregateDefines(processedItems);

        var order = topologicalSortingDAG([rootModuleName], function (name) {
            var m = defines[name];
            return m ? m.requires : null;
        }, function (name) {
            return false;
        }, []);

        var sources = [];
        if (!Array.isArray(globPatternCopy)) {
            globPatternCopy = [globPatternCopy];
        }
        for (var i = 0; i < order.length; i++) {
            var src = defines[order[i]].src;
            for (var j = 0; j < globPatternCopy.length; j++) {
                if (minimatch(src, globPatternCopy[j])) {
                    if (sources.indexOf(src) == -1) {
                        sources.push(src);
                    }
                }
            }
        }

        copyFiles(sources, copyDestinationResolver, function (err, result) {
            if (err) {
                cb(err);
                return;
            }
            cb(null, '[copyUsedModules] done');
        });
    });
};

/** getOrderFileList **/

var getOrderFileList = function (globPatternSearch, globOptions, rootModuleName, globPatternCopy, cbResult) {
    getDefineModulesByGlob(globPatternSearch, globOptions, function (er, processedItems) {
        if (er) {
            cb(er);
            return;
        }

        var defines = aggregateDefines(processedItems);

        var order = topologicalSortingDAG([rootModuleName], function (name) {
            var m = defines[name];
            return m ? m.requires : null;
        }, function (name) {
            return false;
        }, []);

        var sources = [];
        if (!Array.isArray(globPatternCopy)) {
            globPatternCopy = [globPatternCopy];
        }
        for (var i = 0; i < order.length; i++) {
            var src = defines[order[i]].src;
            for (var j = 0; j < globPatternCopy.length; j++) {
                if (minimatch(src, globPatternCopy[j])) {
                    if (sources.indexOf(src) == -1) {
                        sources.push(src);
                        break;
                    }
                }
            }
        }

        cbResult(null, sources);
    });
};

var getOrder = function (globPatternSearch, globOptions, rootModuleName, pathBase, cbResult) {
    getDefineModulesByGlob(globPatternSearch, globOptions, function (er, processedItems) {
        if (er) {
            cb(er);
            return;
        }

        var defines = aggregateDefines(processedItems);

        var order = topologicalSortingDAG([rootModuleName], function (name) {
            var m = defines[name];
            return m ? m.requires : null;
        }, function (name) {
            return false;
        }, []);

        var sources = [];
        for (var i = 0; i < order.length; i++) {
            sources.push({
                src: pathBase == undefined ? defines[order[i]].src : path.relative(pathBase, defines[order[i]].src).replace(/\\/g, '/'),
                name: order[i],
                dependencies: defines[order[i]].requires
            })
        }

        cbResult(null, sources);
    });
};

exports.getDefineModules = getDefineModules;
exports.getDefineModulesByGlob = getDefineModulesByGlob;
exports.aggregateDefines = aggregateDefines;
exports.buildSimpleScriptNonAutoRunOneRootModule = buildSimpleScriptNonAutoRunOneRootModule;
exports.buildManualOneRootNoDependency = buildManualOneRootNoDependency;
exports.injectHtmlScripts = injectHtmlScripts;
exports.injectModulesLinksToHtml = injectModulesLinksToHtml;
exports.getOrderFileList = getOrderFileList;
exports.copyUsedModules = copyUsedModules;
exports.replaceContent = replaceContent;
exports.cleanModulesAtHtml = cleanModulesAtHtml;
exports.getOrder = getOrder;