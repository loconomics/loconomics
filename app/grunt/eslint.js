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
        ]
    },
    test: {
        src: [
            'source/test/**/*.js'
        ]
    }
};
