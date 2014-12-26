/**
    The Shell that manages activities.
**/
'use strict';
var $ = require('jquery');
var escapeRegExp = require('./escapeRegExp');

var shell = {

    currentZIndex: 1,
    
    history: [],
    
    baseUrl: '',
    
    activities: [],

    unexpectedError: function unexpectedError(error) {
        // TODO: enhance with dialog
        var str = typeof(error) === 'string' ? error : JSON.stringify(error);
        console.error('Unexpected error', error);
        window.alert(str);
    },

    loadActivity: function loadActivity(activityName) {
        return new Promise(function(resolve, reject) {
            var $act = this.findActivityElement(activityName);
            if ($act.length) {
                resolve($act);
            }
            else {
                $.ajax({ url: this.baseUrl + activityName + '.html', cache: false }).then(function(html) {
                    // http://stackoverflow.com/a/12848798
                    var body = '<div id="body-mock">' + html.replace(/^[\s\S]*<body.*?>|<\/body>[\s\S]*$/g, '') + '</div>';
                    var $h = $($.parseHTML(body));
                    //var $h = $($.parseHTML(html));
                    $act = this.findActivityElement(activityName, $h);
                    if ($act.length) {
                        $('body').append($act);
                        resolve($act);
                    }
                    else {
                        reject(Error('Activity not found in the source file.'));
                    }
                    
                }.bind(this), reject);
            }
        }.bind(this));
    },
    
    findActivityElement: function findActivityElement(activityName, $root) {
        $root = $root || $(document);
        // TODO: save name parsing for css selector
        return $root.find('[data-activity="' + activityName + '"]');
    },
    
    showActivity: function showActivity(activityName, options) {
        // Ensure its loaded, and do anything later
        this.loadActivity(activityName).then(function($activity) {
            
            $activity.css('zIndex', ++this.currentZIndex).show();
            var currentActivity = this.history[this.history.length - 1];
            this.history.push({
                name: activityName,
                $activity: $activity,
                options: options
            });
            
            this.activities[activityName]
            .init($activity, this)
            .show(options);
            
            // Avoid going to the same activity
            // (can happen with goToActivity)
            if (currentActivity &&
                currentActivity.name !== activityName) {
                this.hideActivity(currentActivity.name);
            }

        }.bind(this)).catch(this.unexpectedError);
    },

    goToActivity: function goToActivity(activityName, options) {

        var currentActivity = this.history.pop();
        this.hideActivity(currentActivity.name);
        this.currentZIndex--;
        this.showActivity(activityName, options);
    },

    hideActivity: function hideActivity(activityName) {

        var $activity = this.findActivityElement(activityName);
        $activity.hide();
    },
    
    goBack: function goBack(options) {

        var previousActivity = this.history[this.history.length - 2];
        this.goToActivity(previousActivity.name, options);
    },
    
    init: function init() {
        /*
        // Detect activities loaded in the current document
        // and initialize them:
        var $activities = $('[data-activity]').each(function() {
            var $activity = $(this);
            var actName = $activity.data('activity');
            if (this.activities.hasOwnProperty(actName)) {
                this.activities[actName].init($activity, null, this);
            }
        }.bind(this));
        */
        
        // Visualize the activity that matches current URL
        var path = document.location.pathname.replace(new RegExp('^' + escapeRegExp(this.baseUrl), 'i'), '');
        //var currentActivityName = path.split('/')[1] || '';
        var currentActivityName = /^\/?([^\/\.]*)/.exec(path);
        currentActivityName = currentActivityName && currentActivityName[1] || '';
        if (currentActivityName) {
            this.showActivity(currentActivityName);
        }
        console.log('currenta ctivity', currentActivityName);
    }
};

module.exports = function Shell() {
    return Object.create(shell);
};
