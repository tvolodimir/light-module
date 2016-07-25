var child_process = require('child_process'),
    inherits = require('util').inherits,
    Emitter = require('events').EventEmitter;

var defaultLimit = 300;

var nop = function () {
};

function ForkScriptRunner(limit) {
    if (!(this instanceof ForkScriptRunner)) {
        return new ForkScriptRunner(limit);
    }
    Emitter.call(this);

    this._process = child_process.fork(__dirname + '/scriptRunnerChild', []);
    this._timerId = null;
    this._responded = true;
    this._disposed = false;
    this._limit = limit ? limit : defaultLimit;
    this._cb = nop;

    var self = this;
    this.__onTimeout = function () {
        self.__onTimeout();
    };

    this._process
        .on('error', function (err) {
            self._onResult(err);
        })
        .on('message', function (message) {
            self._onResult((message.type == 'error') ? message.error : null, message.result);
        })
        .on('exit', function (status) {
            //console.log('exit',status);
            self._onResult(new Error('Execution erminated.'), null);
        });
}
inherits(ForkScriptRunner, Emitter);
ForkScriptRunner.prototype.runScript = function (script, cb) {
    if (this._disposed) {
        throw new Error('Object disposed.');
    }
    if (!this._responded) {
        throw new Error('Previous execution is not over.');
    }
    this._cb = typeof cb === 'function' ? cb : nop;
    this._responded = false;
    this._timerId = setTimeout(this.__onTimeout, this._limit);
    this._process.send(script)
};
ForkScriptRunner.prototype._onResult = function (error, result) {
    //console.log('_onResult', error, result);
    clearTimeout(this._timerId);
    if (this._responded === true) {
        return;
    }
    else {
        this._responded = true;
        this._cb(error, result);
    }
    if (this._disposed === false && error !== null) {
        this._disposed = true;
        var self = this;
        process.nextTick(function () {
            self._process.kill();
        });
        return;
    }
};
ForkScriptRunner.prototype._onTimeout = function () {
    this._onResult(new Error('Execution time is over: ' + this._limit + ' ms'));
};
ForkScriptRunner.prototype.close = function () {
    if (this._responded == false) {
        throw new Error('Can not close. Previous execution is not over.');
    }
    if (this._disposed == true) {
        return;
    }
    this._disposed = true;
    this._process.kill();
};
ForkScriptRunner.prototype.isIdle = function () {
    if (this._responded == false) {
        return false;
    }
    if (this._disposed == true) {
        return false;
    }
    return true;
};
ForkScriptRunner.prototype.isDead = function () {
    if (this._disposed == true) {
        return true;
    }
    return false;
};

module.exports = ForkScriptRunner;