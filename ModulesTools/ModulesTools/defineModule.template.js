(function () {
    var __parseDefines = [];
    var defineModule = function (name, requires, factory) {
        //console.log('define module', name, requires);
        __parseDefines.push({
            name: name,
            requires: requires,
            factory: factory.toString()
        });
    };
    (function () {
        /*%%%*/
    })();
    return __parseDefines;
})();
