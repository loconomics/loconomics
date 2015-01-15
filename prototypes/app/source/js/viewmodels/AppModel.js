/** AppModel, centralizes all the data for the app,
    caching and sharing data across activities and performing
    requests
**/
var ko = require('knockout'),
    Model = require('../models/Model'),
    User = require('../models/User'),
    Rest = require('../utils/Rest');

function AppModel(values) {

    Model(this);
    
    // NOTE: URL to be updated
    this.rest = new Rest('http://dev.loconomics.com/en-US/rest/');
    
    this.model.defProperties({
        user: User.newAnonymous()
    }, values);

    this.login = function login(username, password) {
        
        return this.rest.post('login', {
            username: username,
            password: password
        });
    };
    
    this.logout = function logout() {
        
        return this.rest.post('logout');
    };
}

module.exports = AppModel;
