/** Utils tests file.
 **/
test( "Basic stringFormat utility", function() {
  var v,
      stringFormat = require('StringFormat');
  
  v = stringFormat("{0}", "Hello");
  equal( v, "Hello", "1 parameter replacing, one string '{Hello}'" );
  
  v = stringFormat("{0} {1}!", "Hello", "World");
  equal( v, "Hello World!", "2 parameters, strings with some literals '{Hello} {World}!'" );
});
