/**

    CURRENT CONTENT DISCARDED FOR THE MOBILE/COMMON STYLEGUIDE,
    RENAMED AS ONLY FOR DESKTOP BUT NEEDS REVIEWS.

Scripts that fullfill the in-development Style Guide (more on #757).
The result is used directly by the styleguide site to provide the custom
components built on top of Bootstrap or side by side.
**/
var jQuery = require('jquery');
require('bootstrap');

jQuery(function ($) {

    var HelpPoint = require('../LC/HelpPoint').HelpPoint;
    HelpPoint.enableAll(document);

});
