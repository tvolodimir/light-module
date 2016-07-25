var FileSandbox = require('./FileSandbox');

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

function FilesSandbox(millisecondsLimit) {
    if (!(this instanceof FilesSandbox)) {
        return new FilesSandbox();
    }
    this.filesSandbox = new FileSandbox(millisecondsLimit);
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

module.exports = FilesSandbox;