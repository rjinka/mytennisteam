import { defineConfig } from 'vite';
import obfuscator from 'vite-plugin-javascript-obfuscator'; // Use a generic name like 'obfuscator'
import { readFileSync } from 'fs';
import { resolve } from 'path';

const packageJson = JSON.parse(readFileSync(resolve(__dirname, 'package.json')));

export default defineConfig(({ mode }) => {
    const config = {
        // The root should point to your frontend directory
        root: '.',
        define: {
            'process.env.APP_VERSION': JSON.stringify(packageJson.version),
        },
        server: {
            host: true,
            port: 5000,
        },
        preview: {
            port: 5000,
            host: '0.0.0.0',
        },
        build: {
            // The output directory for the build
            outDir: './dist',
            emptyOutDir: true,
            rollupOptions: {
                input: {
                    main: resolve(__dirname, 'index.html'),
                    privacy: resolve(__dirname, 'privacy.html'),
                },
            },
        },
        plugins: [],
    };

    if (mode === 'production') {
        config.plugins.push(obfuscator({
            options: {
                compact: true,
                controlFlowFlattening: true,
                deadCodeInjection: true,
                numbersToExpressions: true,
                simplify: true,
                stringArrayShuffle: true,
            },
        }));
    }

    return config;
});