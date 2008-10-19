// Mock Objects used for stubbing.
Mock = function() {
    return {
        exception : function() { return function() { throw("Boom"); }; },
        location : function(protocol) { 
            return {
                protocol : protocol
            };
        },
        namespace : function() {
            return {
                prop : function(str) { return str; },
                propf : function(msg, arr) { return msg + " " + arr.join(','); },
                dumped: undefined,
                dump : function(e,message) { 
                    this.dumped = [e,message];
                    return [e,message]; 
                }
            };
        }
    };
};

