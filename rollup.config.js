import json from '@rollup/plugin-json';
import commonjs from '@rollup/plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';

export default {
    input: 'src/main.ts',
    output: [
        {
            file: './build/bundle.plain.js',
            format: 'cjs',
        },
    ],
    plugins: [json(), commonjs(), nodeResolve({ preferBuiltins: true }), typescript({ sourceMap: false })],
};
