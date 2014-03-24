module.exports = function(grunt) {
    grunt.loadNpmTasks('grunt-ts');

    grunt.initConfig({
        pkg : grunt.file.readJSON('package.json'),

        ts : {
            options : {
                target     : 'es5',
                module     : 'commonjs',
                sourceMap  : false,
                references : true,
                noImplicitAny : true
            },

            dev : {
                src    : ['src/**/*.ts'],
                outDir : 'dist'
            },

            watch : {
                src    : ['src/**/*.ts'],
                outDir : 'dist',
                watch  : 'src'
            }
        }
    });

    grunt.registerTask('build',   ['ts:dev']);
    grunt.registerTask('watch',   ['ts:watch']);
    grunt.registerTask('default', ['build']);
};