var fs = require('fs'),
    ForkScriptRunner = require('./ForkScriptRunner');

function FileSandbox(millisecondsLimit) {
    if (!(this instanceof FileSandbox)) {
        return new FileSandbox();
    }
    this.idle = true;
    this.scriptRunner = new ForkScriptRunner(millisecondsLimit);
}
FileSandbox.prototype.runFile = function (file, transformator, onResult) {
    if (this.idle === false) {
        throw new Error('FileSandbox is busy');
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

module.exports = FileSandbox;