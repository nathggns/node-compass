module.exports = function(grunt) {
    grunt.loadNpmTasks('grunt-ts');
    grunt.loadNpmTasks('grunt-mocha-test');

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
                outDir : 'src'
            },

            test : {
                src    : ['test/**/*.ts'],
                outDir : 'test'
            },

            testWatch : {
                src    : ['test/**/*.ts'],
                outDir : 'test',
                watch  : 'test'
            },

            watch : {
                src    : ['src/**/*.ts'],
                outDir : 'src',
                watch  : 'src'
            }
        },

        mochaTest : {
            test : {
                src : ['test/test/**/*.js']
            }
        }
    });

    grunt.registerTask('build',   ['ts:dev']);
    grunt.registerTask('watch',   ['ts:watch']);
    grunt.registerTask('default', ['build']);
    grunt.registerTask('test',    ['ts:test', 'mochaTest:test']);
};