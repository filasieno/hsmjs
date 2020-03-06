const BUILD_DIR = 'build';
const TYPES_DIR = './.types';
const MAP_DIR = './.map';

const grunt = require('grunt');
grunt.loadNpmTasks('grunt-ts');
grunt.loadNpmTasks('grunt-contrib-copy');
grunt.loadNpmTasks('grunt-contrib-clean');

grunt.registerTask('build', 'Build the project', [
    'ts',
    'copy:build_dts',
    'copy:build_map',
    'clean:build_dts',
    'clean:build_map',
]);

grunt.registerTask('rebuild', 'Clean and build', [
    'clean:build',
    'build',
]);

grunt.registerTask('default', ['rebuild']);


grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    ts: {
        build: {
            tsconfig: 'tsconfig.json',
        },
    },
    copy: {
        build_js: {
            expand: true,
            cwd: './src',
            src: '**/**.js',
            dest: `${BUILD_DIR}`,
        },
        build_dts: {
            expand: true,
            cwd: `${BUILD_DIR}`,
            src: '**/**.d.ts',
            dest: `${TYPES_DIR}`,
        },
        build_map: {
            expand: true,
            cwd: `${BUILD_DIR}`,
            src: '**/**.js.map',
            dest: `${MAP_DIR}`,
        },
    },
    clean: {
        build: [`${BUILD_DIR}`, `${MAP_DIR}`, `${TYPES_DIR}`],
        build_map: [`${BUILD_DIR}/**/**.js.map`],
        build_dts: [`${BUILD_DIR}/**/**.d.ts`],
    },
});


