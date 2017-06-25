/** AppModel, centralizes all the data for the app,
    caching and sharing data across activities and performing
    requests
**/
function AppModel() { }

module.exports = AppModel;

/** Initialize and wait for anything up **/
AppModel.prototype.init = function init() {

    // First, get any saved local config presets (used before as appModel.config)
    var config = require('../data/appPresets');
    // compat:
    this.config = config;
    this.rest = require('../data/drivers/restClient');

};
