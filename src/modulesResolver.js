var defineModule, getModule;
(function () {
    "use strict";
    /**
     * Topological sorting (of a DAG) using modified non-recursive Post Order DFS
     * Graph traversal (Tree traversal)
     * @param {Array.<String>} names
     * @param {function(string):Array.<String>} getDependencies
     * @return {Array.<String>}
     */
    var topologicalSortingDAG = function (names, getDependencies) {
        var order = [];
        for (var ni = 0; ni < names.length; ni++) {
            var stack = [names[ni]];
            while (stack.length > 0) {
                var n = stack[stack.length - 1];
                if (order.indexOf(n) > -1) {
                    stack.pop();
                    continue;
                }
                var dependencies = getDependencies(n);
                if (dependencies === null) {
                    throw new Error('dependencies "' + n + '" not found');
                }
                var existsNotResolvedDependencies = false;
                for (var i = 0; i < dependencies.length; i++) {
                    var r = dependencies[i];
                    if (order.indexOf(r) > -1) {
                        continue;
                    }
                    if (stack.indexOf(r) > -1) {
                        throw new Error('circular dependency "' + r + '"');
                    }
                    stack.push(r);
                    existsNotResolvedDependencies = true;
                    break;
                }
                if (existsNotResolvedDependencies === false) {
                    order.push(n);
                    stack.pop();
                }
            }
        }
        return order;
    };

    var modulesManager = {};
    modulesManager.loaded = {};
    modulesManager.defines = {};
    modulesManager.getModule = function (name) {
        if (modulesManager.loaded[name] !== undefined) {
            return modulesManager.loaded[name].exports;
        }
        var order = topologicalSortingDAG([name], function (n) {
            var m = modulesManager.defines[n];
            if (!m) {
                throw new Error('[ModulesManager] module "' + name + '" not defined');
            }
            var dependencies = [];
            for (var i = 0; i < m.requires.length; i++) {
                if (modulesManager.loaded[m.requires[i]] !== undefined) {
                    continue;
                }
                dependencies.push(m.requires[i]);
            }
            return dependencies;
        });

        for (var i = 0; i < order.length; i++) {
            var module = modulesManager.defines[order[i]];
            modulesManager.invoke(module.name, module.requires, module.factory);
        }
        return modulesManager.loaded[name].exports;
    };
    modulesManager.define = function (name, requires, factory) {
        if (modulesManager.defines[name] !== undefined) {
            throw new Error('[ModulesManager] module "' + name + '" already defined');
        }
        modulesManager.defines[name] = {
            name: name,
            requires: requires,
            factory: factory
        };
    };
    modulesManager.invoke = function (name, requires, factory) {
        if (modulesManager.loaded[name]) {
            console.log('[ModulesManager] module ' + name + ' already loaded');
            return false;
        }
        var r = [];
        for (var i = 0; i < requires.length; i++) {
            var m = modulesManager.loaded[requires[i]];
            if (!m) {
                throw new Error('[ModulesManager] module ' + name + ' require ' + requires[i]);
            }
            else {
                r.push(m.exports);
            }
        }


        var mm = {exports: {}};
        modulesManager.loaded[name] = mm;

        r.unshift(mm, modulesManager.getModule);

        console.log('[ModulesManager] loading ' + name);
        try {
            (function () {
                factory.apply(this, r);
            })();
        }
        catch (error) {
            console.error('[ModulesManager]', error['arguments'], error['stack']);
            throw error;
        }
    };

    defineModule = modulesManager.define;
    getModule = modulesManager.getModule;
})();

if (typeof exports !== 'undefined' &&
    typeof require != 'undefined' &&
    typeof global != 'undefined' &&
    typeof __dirname!= "undefined") {
    global.defineModule = defineModule;
    global.getModule = getModule;
}