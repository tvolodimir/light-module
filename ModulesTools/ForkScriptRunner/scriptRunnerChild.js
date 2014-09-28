var _runScript = function (script) {
    var result;
    try {
        (function () {
            result = eval(script);
        })();
    } catch (e) {
        _sendExceptionAndClose(e);
        return;
    }
    __returnScriptResult(result);
};

var isIdle = true;

var __returnScriptResult = function (scriptResult) {
    isIdle = true;
    process.send({
        type: 'result',
        result: scriptResult
    });
};

var _sendExceptionAndClose = function (error) {
    isIdle = false;
    if (error instanceof Error) {
        error = error.message;
    }
    process.send({
        type: 'error',
        error: error
    });
    process.exit();
};

process.on('uncaughtException', function (e) {
    _sendExceptionAndClose(e);
    //console.log(process.pid + ': ' + e.stack);
});

process.on('message', function (message) {
    if (!isIdle == true) {
        return _sendExceptionAndClose(new Error('Not idle process.'));
    }
    isIdle = false;
    try {
        _runScript(message)
    }
    catch (e) {
        _sendExceptionAndClose(e);
    }
});