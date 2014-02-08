/**
  Loconomics specific Widget based on BindableComponent.
  Just decoupling specific behaviors from something more general
  to easily track that details, and maybe future migrations to
  other front-end frameworks.
**/
var DataSource = require('./DataSource');
var BindableComponent = require('./BindableComponent');
var extend = require('./extend').extend;

function LcWidget(element, options) {
  BindableComponent.call(this, element, options);
}
extend(LcWidget.prototype,
  BindableComponent.prototype,
  {
    // Replacing updateData to implement the particular
    // JSON scheme of Loconomics, but reusing original
    // logic inherit from DataSource
    updateData: function (data, mode) {
      if (data && data.Code === 0) {
        DataSource.prototype.updateData.call(this, data.Result, mode);
      } else {
        this.fetchData.onerror(null, 'error', { name: 'data-format', message: data.ErrorMessage });
      }
    }
  }
);

module.exports = LcWidget;