module.exports = {

    app: {
        src: [
            'Gruntfile.js',
            'js/**/*.js'
        ],
        options: {
            ignores: ['tests/**/*.js', '**/*.min.js', 'assets/**/*.js'],
            jshintrc: '.jshintrc',
            // options here to override JSHint defaults
            browser: true,
            laxcomma: true,
            globals: {
                jQuery: true,
                console: true,
                module: true,
                document: true
            }
        }
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
