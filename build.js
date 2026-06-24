#!/usr/bin/env node

/**
 * esbuild build script for Cockpit servicenav plugin.
 *
 * Bundles React + PatternFly + app code into dist/index.js.
 * Compiles SCSS into dist/index.css.
 * Copies static files (index.html, manifest.json) into dist/.
 * Supports --watch flag for development live-reload.
 */

const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

const PROD = process.env.NODE_ENV === 'production';
const WATCH = process.argv.includes('--watch');

// Ensure dist directory exists
const distDir = path.join(__dirname, 'dist');
fs.mkdirSync(distDir, { recursive: true });

// Copy static files
function copyStatic() {
  fs.copyFileSync(
    path.join(__dirname, 'manifest.json'),
    path.join(distDir, 'manifest.json')
  );
  fs.copyFileSync(
    path.join(__dirname, 'src', 'index.html'),
    path.join(distDir, 'index.html')
  );
}

// Main esbuild configuration
const esbuildConfig = {
  entryPoints: ['src/index.tsx'],
  bundle: true,
  outfile: 'dist/index.js',
  format: 'iife',
  globalName: 'servicenav',
  target: ['es2020'],
  loader: {
    '.svg': 'dataurl',
    '.png': 'dataurl',
    '.woff': 'file',
    '.woff2': 'file',
  },
  plugins: [],
  define: {
    'process.env.NODE_ENV': JSON.stringify(PROD ? 'production' : 'development'),
  },
  minify: PROD,
  sourcemap: !PROD,
  metafile: true,
  logLevel: 'info',
};

async function build() {
  copyStatic();
  console.log('Static files copied.');

  if (WATCH) {
    // Watch mode: incremental rebuilds
    const ctx = await esbuild.context(esbuildConfig);
    await ctx.watch();
    console.log('Watching for changes... (Ctrl+C to stop)');
  } else {
    // One-shot build
    const result = await esbuild.build(esbuildConfig);
    if (result.metafile) {
      const analysis = await esbuild.analyzeMetafile(result.metafile);
      console.log(analysis);
    }
    console.log('Build complete. Output in dist/');
  }
}

build().catch((e) => {
  console.error('Build failed:', e);
  process.exit(1);
});
