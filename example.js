Example = function(){
    return {
      wants_num : function(num) {
        typeof(num) === 'number';
      },
      wants_string : function() {
        if(typeof(arguments[0]) === 'string') {
            return true;
        } else {
            return this.is_broken();
        }
      },
      is_broken : function() {
          throw "I'm broken!";
      }
    };
};