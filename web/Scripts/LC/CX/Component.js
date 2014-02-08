/** Component class: wrapper for
  the logic and behavior around
  a DOM element
**/
var extendApi = require('./extend'),
  extend = extendApi.extend;
// We want to be able to real clone functions too on extending:
require('./Object.clone');

function Component(element, options) {
  this.el = element;
  this.$el = $(element);
  extend(this, options);
  // Use the jQuery 'data' storage to preserve a reference
  // to this instance (useful to retrieve it from document)
  this.$el.data('component');
}

extendApi.plugIn(Component.prototype);

module.exports = Component;