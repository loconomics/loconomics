module.exports = {
    options: {
        maxWarnings: 30
    },
    app: {
        src: [
            'source/js/**/*.js'
        ]
    },
    grunt: {
        src: [
            'Gruntfile.js',
            'grunt/**/*.js'
        ],
		options: {
			jshintrc: '.jshintrc'
		}
    }
};
