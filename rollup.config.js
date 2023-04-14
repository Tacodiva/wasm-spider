const typescript = require('@rollup/plugin-typescript');
const terser = require('@rollup/plugin-terser');

const pkg = require('./package.json');
const name = pkg.name;

module.exports = [
    {
        input: ['src/index.ts'],
        output: [{ dir: 'dist/esm', format: 'esm', entryFileNames: '[name].mjs' }],
        plugins: [typescript({ tsconfig: './tsconfig.json', outDir: 'dist/esm' })],
    },
    {
        input: ['src/index.ts'],
        output: [{ dir: 'dist/cjs', format: 'cjs', entryFileNames: '[name].js' }],
        plugins: [typescript({ tsconfig: './tsconfig.json', outDir: 'dist/cjs' })],
    },
    {
        input: ['src/index.ts'],
        output: [{ dir: 'dist/umd', format: 'umd', entryFileNames: '[name].js', name }],
        plugins: [typescript({ tsconfig: './tsconfig.json', outDir: 'dist/umd' }), terser()],
    },
    {
        input: ['src/index.ts'],
        output: [{ dir: 'dist/amd', format: 'amd', entryFileNames: '[name].js', name }],
        plugins: [typescript({ tsconfig: './tsconfig.json', outDir: 'dist/amd' }), terser()],
    },
]