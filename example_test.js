jQuery(function($) {
  // See the README for specific examples on how to hook XulUnit into your extension code.
    
  // Define our own namespace to ensure we don't conflict with the running extension.
  // Also stub out some of the namespace methods, which we'll use as helpers in our validations.
  var namespace = new Mock().namespace();  
    
  module('when being instantiated');
  test("new Example()", function() {
    ok($.pmog != undefined, '$.pmog should be defined');
  });
  
  module('Example units');
  test("When being initialized", function() {
      equals(fakePmog.tab_observer, null, 'Initially tab observer should be null');
      equals(fakePmog.chrome, null, 'Initially chrome should be null');
  });  
});