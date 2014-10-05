(function () {
    "use strict";

    /**
     * @param {Array.<T>} array
     * @param {T} value
     * @param {function(T, T):boolean} comparer
     * @returns {boolean}
     * @template T
     */
    var isContainInArray = function (array, value, comparer) {
        for (var i = 0; i < array.length; i++) {
            if (comparer(array[i], value)) return true;
        }
        return false;
    };

    /**
     * @param {Array.<T>} items
     * @param {function(T):array} getDependencies
     * @param {function(T):boolean} isSkip
     * @param {Array.<T>|undefined} order
     * @param {function(T, T):boolean} isEqualFn
     * @return {{type:string, [result]:Array.<T>, [errorType]:string, [error]:Error, [missedDependency]:T, [circularDependency]:T}}
     * @template T
     */
    var topologicalSortingDAG = function (items, getDependencies, isSkip, order, isEqualFn) {
        /*
         * Topological sorting (of a DAG) using modified non-recursive Post Order DFS
         * Graph traversal (Tree traversal)
         */
        if (order === undefined) {
            order = [];
        }
        for (var ni = 0; ni < items.length; ni++) {
            var stack = [items[ni]];
            while (stack.length > 0) {
                var item = stack[stack.length - 1];
                if (isContainInArray(order, item, isEqualFn)) {
                    stack.pop();
                    continue;
                }
                if (isSkip(item)) {
                    stack.pop();
                    continue;
                }
                var dependencies = getDependencies(item);
                if (dependencies === null) {
                    return {
                        type: 'error',
                        errorType: 'DependenciesNotFound',
                        error: new Error('dependencies "' + item + '" not found'),
                        missedDependency: item
                    }
                }
                var existsNotResolvedDependencies = false;
                for (var i = 0; i < dependencies.length; i++) {
                    var r = dependencies[i];
                    if (isContainInArray(order, r, isEqualFn)) {
                        continue;
                    }
                    if (isContainInArray(stack, r, isEqualFn)) {
                        return {
                            type: 'error',
                            errorType: 'CircularDependency',
                            error: new Error('circular dependency "' + r + '"'),
                            circularDependency: r
                        };
                    }
                    stack.push(r);
                    existsNotResolvedDependencies = true;
                    break;
                }
                if (existsNotResolvedDependencies === false) {
                    order.push(item);
                    stack.pop();
                }
            }
        }
        return {
            type: 'result',
            result: order
        };
    };

    var Module = function (assembly, name, dependencyNames, factory) {
        this.assembly = assembly;
        this.name = name;
        this.dependencyNames = dependencyNames;
        this.factory = factory;
        this.exports = undefined;
    };
    Module.prototype.toString = function () {
        return this.assembly.name + '.' + this.name;
    };

    var Assembly = function (name, dependencies) {
        this.name = name;
        this.dependencies = dependencies;
        this.modules = {};
        var self = this;
        this.findModuleExportsBind = function (name) {
            return self.findModuleExports(name);
        };
        this.defineModuleBind = function (name, requires, factory) {
            self.defineModule(name, requires, factory);
        };
        this.getModuleBind = function (name) {
            return self.getModule(name);
        };
    };
    Assembly.prototype.getModule = function (name) {
        var module = this.modules[name];
        if (module === undefined) {
            throw new Error('[DomainManager] module "' + this.name + '.' + name + '" doesn\'t defined');
        }
        if (module.exports !== undefined) {
            return module.exports.exports;
        }
        var resultSort = topologicalSortingDAG([module], function (m) {
            if (m === undefined) return null;
            var dependencies = [];
            for (var i = 0; i < m.dependencyNames.length; i++) {
                var module = m.assembly.findModule(m.dependencyNames[i]);
                if (module !== undefined && module.exports !== undefined) {
                    continue;
                }
                dependencies.push(module);
            }
            return dependencies;
        }, function (m) {
            return false;//m.exports !== undefined;
        }, [], function (a, b) {
            return a === b;
        });

        if (resultSort.type === 'error') {
            throw resultSort.error;
        }
        else {
            var order = resultSort.result;
            for (var i = 0; i < order.length; i++) {
                order[i].assembly._buildModule(order[i].name);
            }
        }
        return module.exports.exports;
    };
    Assembly.prototype.defineModule = function (name, requires, factory) {
        if (this.modules[name] !== undefined) {
            throw new Error('[DomainManager] module "' + this.name + '.' + name + '" already defined');
        }
        this.modules[name] = new Module(this, name, requires, factory);
    };
    Assembly.prototype._buildModule = function (name) {
        var module = this.modules[name];
        if (module === undefined) {
            throw new Error('[DomainManager] module "' + this.name + '.' + name + '" not defined');
        }
        if (module.exports !== undefined) {
            console.log('[DomainManager] module "' + this.name + '.' + name + '" already loaded');
            return true;
        }
        var requires = module.dependencyNames;
        var factory = module.factory;
        var r = [];
        for (var i = 0; i < requires.length; i++) {
            r.push(this.findModuleExports(requires[i]));
        }

        var mm = {exports: {}};
        module.exports = mm;
        r.unshift(mm, this.findModuleExportsBind);

        var assemblyName = this.name;
        (function () {
            console.log('[DomainManager] loading module "' + assemblyName + '.' + name + '"');
            try {
                factory.apply(this, r);
            }
            catch (error) {
                console.error('[DomainManager] error loading module "' + assemblyName + '.' + name + '"', error['arguments'], error['stack']);
            }
        })();
    };
    Assembly.prototype.findModule = function (name) {
        if (this.modules[name] !== undefined) {
            return this.modules[name];
        }
        for (var i = 0; i < this.dependencies.length; i++) {
            var assemblyName = this.dependencies[i];
            var assembly = domain.getAssembly(assemblyName);
            if (assembly !== null) {
                if (assembly.modules[name] !== undefined) {
                    return assembly.modules[name];
                }
            }
        }
        return undefined;
    };
    Assembly.prototype.findModuleExports = function (name) {
        var module = this.findModule(name);
        if (module === undefined) {
            throw new Error('[DomainManager] for assembly "' + this.name + '" not defined "' + name + '"');
        }
        if (module.exports === undefined) {
            throw new Error('[DomainManager] for assembly "' + this.name + '" not loaded "' + name + '"');
        }
        return module.exports.exports;
    };

    var domain = {};
    domain.assemblies = [];
    domain.defineAssembly = function (name, dependencies) {
        if (domain.assemblies[name] !== undefined) {
            throw new Error('[DomainManager] assembly "' + name + '" already defined');
        }
        return domain.assemblies[name] = new Assembly(name, dependencies);
    };
    domain.getAssembly = function (name) {
        return domain.assemblies[name];
    };
    domain.assembly = function (name) {
        var assembly = domain.assemblies[name];
        if (assembly === undefined) {
            throw new Error('[DomainManager] assembly "' + name + '" doesn\'t defined');
        }
        return assembly.getModuleBind;
    };

    var assemblyPublic = function (assemblyName, dependencies) {
        var assembly;

        if (dependencies === undefined) {
            assembly = domain.getAssembly(assemblyName);
            if (assembly === undefined) {
                throw new Error('[DomainManager] assembly "' + assemblyName + '" not defined');
            }
        }
        else {
            assembly = domain.defineAssembly(assemblyName, dependencies);
        }

        var obj = {
            module: function (name, requires, factory) {
                if (requires === undefined && factory === undefined) {
                    return assembly.getModuleBind(name);
                }
                else {
                    assembly.defineModuleBind(name, requires, factory);
                    return obj;
                }
            }
        };

        return obj;
    };

    var scope = (typeof window === 'undefined') ? exports : window;
    scope.assembly = assemblyPublic;
})();