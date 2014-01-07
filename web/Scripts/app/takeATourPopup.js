/**
* Take a tour
*/
var Cookie = require('../LC/Cookie');
var popup = require('../LC/popup');

exports.show = function takeATour() {
    // Check the cookie:
    if (!Cookie.get('lcTakeATour')) {
        var p = popup(LcUrl.LangPath + 'HelpCenter/$TakeATour/', { width: 310, height: 480 });
        p.on('click', '.main-action', function () {
            Cookie.set('lcTakeATour', 'Taken!', 365);
            p.closePopup();
        });
        p.on('click', '.close-popup', function () {
            Cookie.set('lcTakeATour', 'Skipped!', 365);
        });
    }
};