var fs = require('fs'),
    glob = require('glob'),
    path = require('path');

/**
 * @param {Array} items
 * @param {function(Object, Function)} action
 * @param {Function} cb
 */
var arrayAction = function (items, action, cb) {
    if (items == null) {
        cb();
        return;
    }
    var index = 0;
    var next = function next() {
        if (index === items.length) {
            cb();
            return;
        }
        action(items[index++], next);
    };
    next();
};

var spliceString = function (string, index, numToDelete, char) {
    return string.substr(0, index) + char + string.substr(index + numToDelete);
};

var replaceRange = function (str, startMark, endMark, text) {
    var t0 = str.indexOf(startMark);
    if (t0 > -1) {
        t0 += startMark.length;
        var t1 = str.indexOf(endMark);
        if (t1 > -1) {
            return spliceString(str, t0, t1 - t0, text);
        }
    }
    throw new Error('range not found');
};

var replaceRangeInFile = function (src, startMark, endMark, text, cb) {
    fs.readFile(src, function (err, data) {
        if (err) {
            cb(err);
            return;
        }
        var resultStr = replaceRange(data.toString(), startMark, endMark, text);
        fs.writeFile(src, resultStr, function (err) {
            if (err) {
                cb(err);
            } else {
                cb();
            }
        });
    });
};

var copyFile = function (source, target, cb) {
    var cbCalled = false;

    var d = path.dirname(target);
    fs.exists(d, function (exists) {
        if (!exists) {
            fs.mkdir(d, nextCb);
        }
        else {
            nextCb();
        }
    });

    var nextCb = function () {
        var rd = fs.createReadStream(source);
        rd.on("error", done);

        var wr = fs.createWriteStream(target);
        wr.on("error", done);
        wr.on("close", function (ex) {
            done();
        });
        rd.pipe(wr);

        function done(err) {
            if (!cbCalled) {
                cb(err);
                cbCalled = true;
            }
        }
    };
};



var globArray = function (patterns, options, cb) {
    var i, list = [];
    if (!Array.isArray(patterns)) {
        patterns = [patterns];
    }

    arrayAction(patterns, function (pattern, cbNext) {
        if (pattern[0] === "!") {
            i = list.length - 1;
            while (i > -1) {
                if (!minimatch(list[i], pattern)) {
                    list.splice(i, 1);
                }
                i--;
            }
            cbNext();
        }
        else {
            glob(pattern, options, function (er, files) {
                files.forEach(function (item) {
                    if (list.indexOf(item) === -1) {
                        list.push(item);
                    }
                });
                cbNext();
            });
        }
    }, function () {
        cb(null, list);
    });
};

var safeInvokeActionBeforeCallback = function (action, cb) {
    var err = null, res = null;
    try {
        res = action();
    }
    catch (error) {
        err = error;
    }
    cb(err, res);
};

var copyFiles = function (sources, copyDestinationResolver, onResult) {
    arrayAction(sources, function (source, nextCb) {
        var target = copyDestinationResolver(source);
        if (target == null) {
            nextCb();
            return;
        }
        copyFile(source, target, function (err) {
            if (err === undefined) {
                nextCb();
            }
            else {
                onResult(err);
            }
        })
    }, onResult);
};

exports.arrayAction = arrayAction;
exports.replaceRangeInFile = replaceRangeInFile;
exports.copyFile = copyFile;
exports.copyFiles = copyFiles;
exports.topologicalSortingDAG = topologicalSortingDAG;
exports.globArray = globArray;
exports.safeInvokeActionBeforeCallback = safeInvokeActionBeforeCallback;