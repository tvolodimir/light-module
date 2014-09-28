defineModule('a', ['b', 'c', 'parse-error'], function (module, $r) {

	var b = $r('b');
	var c = $r('c');
	var parseError = $r('parse-error');
 
    module.a = 'a';
});