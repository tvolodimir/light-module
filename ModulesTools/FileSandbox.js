var fs = require('fs'),
    glob = require('glob'),
    ForkScriptRunner = require('./ForkScriptRunner/scriptRunnerParent').ForkScriptRunner;

exports.FileSandbox = FileSandbox;
exports.FilesSandbox = FilesSandbox;
exports.FilesSandboxAggregate = FilesSandboxAggregate;
exports.FilesSandboxAggregateGlob = FilesSandboxAggregateGlob;

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

function FileSandbox() {
    if (!(this instanceof FileSandbox)) {
        return new FileSandbox();
    }
    this.idle = true;
    this.scriptRunner = new ForkScriptRunner(300);
}
FileSandbox.prototype.runFile = function (file, transformator, onResult) {
    if (this.idle === false) {
        throw new Error('DefineModuleSolver is busy');
    }
    this.idle = false;
    var self = this;
    fs.readFile(file, function (err, content) {
        if (err) {
            self.idle = true;
            throw onResult(err);
        }

        var script = transformator(content);

        if (self.scriptRunner.isDead()) {
            self.scriptRunner = new ForkScriptRunner(300);
        }

        self.scriptRunner.runScript(script, function (error, result) {
            self.idle = true;
            onResult(error, result);
        });
    });
};

function FilesSandbox() {
    if (!(this instanceof FilesSandbox)) {
        return new FilesSandbox();
    }
    this.filesSandbox = new FileSandbox();
}
FilesSandbox.prototype.runFiles = function (files, transformator, onFileResult, onEnd) {
    var self = this;
    arrayAction(files, function (filePath, nextCb) {
        self.filesSandbox.runFile(filePath, transformator, function (err, result) {
            var next = false, e = null;
            try {
                next = onFileResult(err, result, filePath);
            }
            catch (er) {
                e = er;
            }
            if (next) {
                nextCb();
            }
            else {
                onEnd(e);
            }
        });
    }, onEnd);
};

function FilesSandboxAggregate() {
    if (!(this instanceof FilesSandboxAggregate)) {
        return new FilesSandboxAggregate();
    }
    this.filesSandbox = new FilesSandbox();
    this.processedItems = [];
}
FilesSandboxAggregate.prototype.runFiles = function (files, transformator, onResult) {
    var self = this;
    self.filesSandbox.runFiles(files, transformator, function (err, result, filePath) {
        self.processedItems.push({
            error: err,
            filePath: filePath,
            result: result
        });
        return true;
    }, function () {
        onResult(null, self.processedItems);
    });
};

function FilesSandboxAggregateGlob() {
    if (!(this instanceof FilesSandboxAggregateGlob)) {
        return new FilesSandboxAggregateGlob();
    }
    this.filesSandboxAggregate = new FilesSandboxAggregate();
}
FilesSandboxAggregateGlob.prototype.runFiles = function (globPatternSearch, globOptions, transformator, onResult) {
    var self = this;
    globArray(globPatternSearch, globOptions, function (er, files) {
        if (er) {
            onResult(er);
            return;
        }
        self.filesSandboxAggregate.runFiles(files, transformator, onResult);
    });
};