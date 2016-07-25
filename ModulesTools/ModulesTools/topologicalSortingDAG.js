/**
 * @param {Array.<String>} names
 * @param {function(string):array} getDependencies
 * @param {function(string):boolean} isSkip
 * @param {Array.<String>} order
 * @return {{type:string, result:Array.<String>, errorType:string, error:Error, missedDependency:string, circularDependency:string}}
 */
var topologicalSortingDAG = function (names, getDependencies, isSkip, order) {
    /*
     * Topological sorting (of a DAG) using modified non-recursive Post Order DFS
     * Graph traversal (Tree traversal)
     */
    if (order === undefined) {
        order = [];
    }
    for (var ni = 0; ni < names.length; ni++) {
        var stack = [names[ni]];
        while (stack.length > 0) {
            var n = stack[stack.length - 1];
            if (order.indexOf(n) > -1) {
                stack.pop();
                continue;
            }
            if (isSkip(n)) {
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

module.exports = topologicalSortingDAG;