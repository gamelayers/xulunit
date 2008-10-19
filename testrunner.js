/*
 * XulUnit - Xul unit testrunner
 * By Mark Daggett http://www.locusfoc.us
 *
 * Based around Qunit the JQuery Unit testrunner by John Resig, Jörn Zaefferer
 * http://docs.jquery.com/QUnit
 *
 * Written for Gamelayers and PMOG
 * Copyright (c) 2008 Gamelayers
 * License MIT MIT-LICENSE.txt
 */

var _config = {
	fixture: null,
	Test: [],
	stats: {
		all: 0,
		good: 0,
		pending: 0,
		bad: 0
	},
	moduleCount: 1,
	queue: [],
	blocking: true,
	timeout: null,
	expected: null,
	currentModule: null,
	asyncTimeout: 2 // seconds for async timeout
};

_config.filters = location.search.length > 1 && //restrict modules/tests by get parameters
		jQuery.map( location.search.slice(1).split('&'), decodeURIComponent );

var isLocal = !!(window.location.protocol == 'file:');

function synchronize(callback) {
	_config.queue[_config.queue.length] = callback;
	if(!_config.blocking) {
		process();
	}
}

function process() {
	while(_config.queue.length && !_config.blocking) {
		var call = _config.queue[0];
		_config.queue = _config.queue.slice(1);
		call();
	}
}

function stop(allowFailure) {
	_config.blocking = true;
	var handler = allowFailure ? start : function() {
		ok( false, "Test timed out" );
		start();
	};
	// Disabled, caused too many random errors
	//_config.timeout = setTimeout(handler, _config.asyncTimeout * 1000);
}
function start() {
	// A slight delay, to avoid any current callbacks
	setTimeout(function(){
		if(_config.timeout) {
			clearTimeout(_config.timeout);
		}
		_config.blocking = false;
		process();
	}, 13);
}

function validTest( name ) {
	var filters = _config.filters;
	if( !filters ){
		return true;
    }
    
	var i = filters.length,
		run = false;
	while( i-- ) {
		var filter = filters[i],
			not = filter.charAt(0) == '!';
		if( not ) {
			filter = filter.slice(1);
		}
		if( name.indexOf(filter) != -1 ) {
			return !not;
		}
		if( not ) {
			run = true;
		}
	}
	return run;
}

function setup(element) {
  var parent = document.getElementById(element);
  if(!document.getElementById('testBody')) {
    var testBody = document.createElement('box');
    testBody.setAttribute('id', 'testBody');
    testBody.setAttribute('orient', 'vertical');
    
    var testHeader = document.createElement('hbox');
    testHeader.setAttribute('id', 'testHeader');
    
    
    var spacer = document.createElement('spacer');
    spacer.setAttribute('flex', '1');
    testHeader.appendChild(spacer);
    
    var closeButton = document.createElement('button');
    closeButton.setAttribute('id', 'closeButton');
    closeButton.setAttribute('label', 'close');
    closeButton.setAttribute("oncommand","jQuery(function($){tearDown()});");
    testHeader.appendChild(closeButton);
    
    testBody.appendChild(testHeader);

    var tests = document.createElement('vbox');
    tests.setAttribute('id', 'tests');
    testBody.appendChild(tests);
    
    var main = document.createElement('vbox');
    main.setAttribute('id', 'main');
    testBody.appendChild(main);
    
    var results = document.createElement('vbox');
    results.setAttribute('id', 'testresult');
    testBody.appendChild(results);
    
    parent.appendChild(testBody);
  }
}

function tearDown() {
  jQuery("#testBody").remove();
}

function runTest() {
    setup();
	_config.blocking = false;
	var started = +new Date;
	_config.ajaxSettings = jQuery.ajaxSettings;
	synchronize(function() {
	    var p = document.getElementById('testresult');
	    p.appendChild(document.createTextNode('Tests completed in ' + (new Date - started) + ' milliseconds. '));
	    var b = document.createTextNode('Passed('+ _config.stats.good+') ');
	    p.appendChild(b);
	    b = document.createTextNode( 'Failed(' + _config.stats.bad + ') ');
	    p.appendChild(b);
	    b = document.createTextNode( 'Pending(' + _config.stats.pending + ') ');
	    p.appendChild(b);
	    p.appendChild(document.createTextNode('Total(' + _config.stats.all + ')'));
	    
	    if(_config.stats.bad > 0 ) {
	        document.getElementById('testHeader').className = "testcaseFail";
        } else {
            document.getElementById('testHeader').className = "testcasePass";
	    }
	});
}

function test(name, callback, nowait) {
	if(_config.currentModule) {
		name = (_config.moduleCount++)+ '. ' + _config.currentModule + " module: " + name;
	}
	if ( !validTest(name) ) {
		return;
	}
	synchronize(function() {
		_config.Test = [];
		try {
			callback();
		} catch(e) {
			if( typeof console != "undefined" && console.error && console.warn ) {
				console.error("Test " + name + " died, exception and test follows");
				console.error(e);
				console.warn(callback.toString());
			}
			_config.Test.push( [ false, "Died on test #" + (_config.Test.length+1) + ": " + e.message ] );
		}
	});
	synchronize(function() {
		try {
			reset();
		} catch(e) {
			if( typeof console != "undefined" && console.error && console.warn ) {
				console.error("reset() failed, following Test " + name + ", exception and reset fn follows");
				console.error(e);
				console.warn(reset.toString());
			}
		}
		
		// don't output pause tests
		if(nowait){return;}
		
		if(_config.expected && _config.expected != _config.Test.length) {
			_config.Test.push( [ false, "Expected " + _config.expected + " assertions, but " + _config.Test.length + " were run" ] );
		}
		_config.expected = null;
		
		var good = 0, bad = 0, pending = 0;
		var ol = document.createElement("box");
		ol.style.display = "none";
		var li = "", state = "pending";
		for ( var i = 0; i < _config.Test.length; i++ ) {
			li = document.createElement("box");
			switch(_config.Test[i][0]) {
			    case true :
			        li.className = "testcasePass";
			        break;
			    case false :
			        li.className = "testcaseFail";
			        break;
			    case undefined :
			        li.className = "testcasePending";
			        break;
		    }
		    var out = document.createTextNode((i+1) + '. '+_config.Test[i][1])
			li.appendChild( out );
			ol.appendChild( li );
			
			_config.stats.all++;
			switch(_config.Test[i][0]) {
			  case true : 
			      if (state != "fail") { state = "pass"; }
			      good++;
			      _config.stats.good++;
			      break;
			  case undefined :
			      pending++;
			      _config.stats.pending++;
			      break;
			  case false :
			      state = "fail";
			      bad++;
			      _config.stats.bad++;
			     break;
			}
		}
	
		li = document.createElement("vbox");
		li.className = state;
	
		var b = document.createElement("vbox");
		b.className = "testName";
		b.appendChild(document.createTextNode(name + "(" + bad + ", " + good + ", " + pending + " : " + _config.Test.length + ")"));
		b.onclick = function(){
			var n = this.nextSibling;
			if ( jQuery.css( n, "display" ) == "none" ) {
				n.style.display = "block";
			} else {
				n.style.display = "none";
			}
		};
		li.appendChild( b );
		li.appendChild( ol );
	
		document.getElementById("tests").appendChild( li );
	});
}

// call on start of module test to prepend name to all tests
function module(moduleName) {
	_config.currentModule = moduleName;
}

/**
 * Specify the number of expected assertions to gurantee that failed test (no assertions are run at all) don't slip through.
 */
function expect(asserts) {
	_config.expected = asserts;
}

/**
 * Resets the test setup. Useful for tests that modify the DOM.
 */
function reset() {
    while (jQuery("#testBody").childNodes.length > 0) {
        jQuery("#testBody").removeChild(jQuery("#testBody").childNodes[0]);
    }
    jQuery("#testBody").remove();
    _config.moduleCount = 1;
	jQuery.event.global = {};
	jQuery.ajaxSettings = jQuery.extend({}, _config.ajaxSettings);
}

/**
 * Asserts true.
 * @example ok( jQuery("a").size() > 5, "There must be at least 5 anchors" );
 */
function ok(a, msg) {
	_config.Test.push( [ !!a, msg ] );
}

/**
 * Asserts that two arrays are the same
 */
function isSet(a, b, msg) {
	var ret = true;
	if ( a && b && a.length != undefined && a.length == b.length ) {
		for ( var i = 0; i < a.length; i++ ) {
			if ( a[i] != b[i] ) {
				ret = false;
			}
		}
	} else {
		ret = false;
	}
	if ( !ret ) {
		_config.Test.push( [ ret, msg + " expected: " + serialArray(b) + " result: " + serialArray(a) ] );
	} else {
		_config.Test.push( [ ret, msg ] );
	}
}

/**
 * Asserts that two objects are equivalent
 */
function isObj(a, b, msg) {
	var ret = true;
	
	if ( a && b ) {
		for ( var i in a ) {
			if ( a[i] != b[i] ) {
				ret = false;
			}
        }
        
		for ( i in b ) {
			if ( a[i] != b[i] ) {
				ret = false;
			}
		}
	} else {
		ret = false;
    }
    _config.Test.push( [ ret, msg ] );
}

function serialArray( a ) {
	var r = [];
	
	if ( a && a.length ) {
        for ( var i = 0; i < a.length; i++ ) {
            var str = a[i].nodeName;
            if ( str ) {
                str = str.toLowerCase();
                if ( a[i].id ) {
                    str += "#" + a[i].id;
                }
            } else {
                str = a[i];
            }
            r.push( str );
            
        }
    }
	return "[ " + r.join(", ") + " ]";
}

function flatMap(a, block) {
	var result = [];
	$.each(a, function() {
		var x = block.apply(this, arguments);
		if (x !== false) {
			result.push(x);
		}
	});
	return result;
}

function serialObject( a ) {
	return "{ " + flatMap(a, function(key, value) {
		return key + ": " + value;
	}).join(", ") + " }";
}

function compare(a, b, msg) {
	var ret = true;
	if ( a && b && a.length != undefined && a.length == b.length ) {
		for ( var i = 0; i < a.length; i++ ) {
			for(var key in a[i]) {
				if (a[i][key].constructor == Array) {
					for (var arrayKey in a[i][key]) {
						if (a[i][key][arrayKey] != b[i][key][arrayKey]) {
							ret = false;
						}
					}
				} else if (a[i][key] != b[i][key]) {
					ret = false;
				}
			}
		}
	} else {
		ret = false;
	}
	ok( ret, msg + " expected: " + serialArray(b) + " result: " + serialArray(a) );
}

function compare2(a, b, msg) {
	var ret = true;
	if ( a && b ) {
		for(var key in a) {
			if (a[key].constructor == Array) {
				for (var arrayKey in a[key]) {
					if (a[key][arrayKey] != b[key][arrayKey]) {
						ret = false;
					}
				}
			} else if (a[key] != b[key]) {
				ret = false;
			}
		}
		for(key in b) {
			if (b[key].constructor == Array) {
				for (arrayKey in b[key]) {
					if (a[key][arrayKey] != b[key][arrayKey]) {
						ret = false;
					}
				}
			} else if (a[key] != b[key]) {
				ret = false;
			}
		}
	} else {
		ret = false;
	}
	ok( ret, msg + " expected: " + serialObject(b) + " result: " + serialObject(a) );
}

/**
 * Returns an array of elements with the given IDs, eg.
 * @example q("main", "foo", "bar")
 * @result [<div id="main">, <span id="foo">, <input id="bar">]
 */
function q() {
	var r = [];
	for ( var i = 0; i < arguments.length; i++ ) {
		r.push( document.getElementById( arguments[i] ) );
	}
	return r;
}

/**
 * Asserts that a select matches the given IDs
 * @example t("Check for something", "//[a]", ["foo", "baar"]);
 * @result returns true if "//[a]" return two elements with the IDs 'foo' and 'baar'
 */
function t(a,b,c) {
	var f = jQuery(b);
	var s = "";
	for ( var i = 0; i < f.length; i++ ) {
		s += (s && ",") + '"' + f[i].id + '"';
	}
	isSet(f, q.apply(q,c), a + " (" + b + ")");
}

/**
 * Asserts that a function raises a specific error
 * @example assert_raises(function(){ foo = bar; }, "ArgumentError", "should raise an error");
 */
function raises(fn,err_string, msg) {
    try{
      fn();
      _config.Test.push( [ false, "Expected an error but none was thrown." ] );
    }catch(e){
        equals(e.message,err_string, msg);
    }
}

/**
 * Add random number to url to stop IE from caching
 *
 * @example url("data/test.html")
 * @result "data/test.html?10538358428943"
 *
 * @example url("data/test.php?foo=bar")
 * @result "data/test.php?foo=bar&10538358345554"
 */
function url(value) {
	return value + (/\?/.test(value) ? "&" : "?") + new Date().getTime() + "" + parseInt(Math.random()*100000,10);
}

/**
 * Checks that the first two arguments are equal, with an optional message.
 * Prints out both actual and expected values.
 *
 * Prefered to ok( actual == expected, message )
 *
 * @example equals( $.format("Received {0} bytes.", 2), "Received 2 bytes." );
 *
 * @param Object actual
 * @param Object expected
 * @param String message (optional)
 */
function equals(actual, expected, message) {
	var result = expected == actual;
	message = message || (result ? "okay" : "failed");
	_config.Test.push( [ result, result ? message + ": " + expected : message + " expected: " + expected + " actual: " + actual ] );
}

/**
 * Adds a pending test output 
 *
 * @example pending('please write this tests')
 * 
 * @param String message (optionsl)
 */
function pending(message) {
  _config.Test.push( [ undefined, message ? "Pending: " + message : "This test is pending."] );
}

/**
 * Trigger an event on an element.
 *
 * @example triggerEvent( document.body, "click" );
 *
 * @param DOMElement elem
 * @param String type
 */
function triggerEvent( elem, type, event ) {
	if ( jQuery.browser.mozilla || jQuery.browser.opera ) {
		event = document.createEvent("MouseEvents");
		event.initMouseEvent(type, true, true, elem.ownerDocument.defaultView,
			0, 0, 0, 0, 0, false, false, false, false, 0, null);
		elem.dispatchEvent( event );
	} else if ( jQuery.browser.msie ) {
		elem.fireEvent("on"+type);
	}
}
