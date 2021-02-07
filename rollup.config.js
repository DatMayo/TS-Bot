import typescript from '@rollup/plugin-typescript';
import nodeResolve from '@rollup/plugin-node-resolve';
// import autoExternal from 'rollup-plugin-auto-external';

import commonjs from '@rollup/plugin-commonjs';
import pkg from './package.json';

export default {
    input: 'src/main.ts',
    output: [
        {
            file: './dist/bundle.plain.js',
            format: 'cjs',
        },
    ],
    external: [...Object.keys(pkg.dependencies || {}), ...Object.keys(pkg.peerDependencies || {})],
    plugins: [
        commonjs(),
        nodeResolve({
            moduleDirectories: ['node_modules'],
            mainFields: ['default', 'module', 'require'],
        }),
        typescript({ sourceMap: false }),
        /* autoExternal({
            builtins: true,
            dependencies: true,
            packagePath: './package.json',
            peerDependencies: false,
        }), */
    ],
};
