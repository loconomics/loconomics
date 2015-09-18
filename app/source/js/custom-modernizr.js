/** Load Modernizr custom build.
    Uses the module Browsernizr with just the tests
    we want.
 **/
// Tests que necesitamos
require('browsernizr/test/inputtypes');
require('browsernizr/test/css/transforms');

// Cargando Modernizr y devolviendo la instancia:
module.exports = require('browsernizr');
