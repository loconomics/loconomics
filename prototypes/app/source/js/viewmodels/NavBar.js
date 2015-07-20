/** NavBar view model.
    It allows customize the NavBar per activity.
**/
var Model = require('../models/Model'),
    NavAction = require('./NavAction');

function NavBar(values) {
    
    Model(this);
    
    this.model.defProperties({
        // Title showed in the center
        // When the title is 'null', the app logo is showed in place,
        // on empty text, the empty text is showed and no logo.
        title: '',
        leftAction: {
            Model: NavAction
        },
        rightAction: {
            Model: NavAction
        }
    }, values);
}

module.exports = NavBar;
