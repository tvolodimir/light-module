var FilesSandbox = require('./FilesSandbox');

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

module.exports = FilesSandboxAggregate;