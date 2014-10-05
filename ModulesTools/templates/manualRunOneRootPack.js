(function () {
    "use strict";
    var loaded = {};
    var getModule = function (name) {
        return loaded[name].exports;
    };
    var invoke = function (name, requires, factory) {
        var mm = {exports: {}};
        loaded[name] = mm;
        var r = [mm, getModule];
        for (var i = 0; i < requires.length; i++) {
            r.push(loaded[requires[i]].exports);
        }
        (function () {
            try {
                factory.apply(this, r);
            }
            catch (error) {
                console.error('[moduleRunner] error while executing "' + name + '"', error['arguments'], error['stack']);
            }
        })();
    };
    var modules = [/*%Modules%*/];
    var rootName = null;
    var loadAll = function () {
        if (modules.length > 0) {
            rootName = modules[modules.length - 1][0];
        }
        var m;
        for (var i = 0; i < modules.length; i++) {
            m = modules[i];
            invoke(m[0], m[1], m[2]);
        }
        modules.length = 0;
        return getModule(rootName);
    };
    var scope = (typeof window === 'undefined') ? exports : window;
    var assemblyName = '/*%ExposePackName%*/';
    if (scope[assemblyName] !== undefined) {
        throw new Error('Assembly "' + assemblyName + '" is already defined');
    }
    var assembly = scope[assemblyName] = {};
    assembly.init = function () {
        return loadAll();
    };
})();