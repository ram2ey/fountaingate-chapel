const fs = require('node:fs/promises');
const path = require('node:path');
const { webpack } = require('next/dist/compiled/webpack/webpack');
let built;

// Bundle actual client components with a router adapter and synthetic account props.
// All output stays in the ignored build directory; production auth is untouched.
function buildUIFixture() {
  if (!built) built = new Promise((resolve, reject) => {
    const compiler = webpack({
      mode: 'development', devtool: false, target: 'web',
      plugins: [new webpack.DefinePlugin({ 'process.env': JSON.stringify({ NODE_ENV: 'development' }) })],
      entry: path.join(__dirname, 'ui-entry.tsx'),
      output: { path: path.resolve('.next/ui-tests'), filename: 'ui.js', publicPath: '/__ui_assets/' },
      resolve: { extensions: ['.tsx', '.ts', '.js'], alias: { 'next/navigation$': path.join(__dirname, 'next-navigation.ts') } },
      module: { rules: [{ test: /\.tsx?$/, exclude: /node_modules/, use: path.join(__dirname, 'ts-loader.cjs') }] },
    });
    compiler.run((error, stats) => compiler.close(closeError => {
      if (error || closeError) reject(error || closeError);
      else if (stats.hasErrors()) reject(new Error(stats.toString({ all: false, errors: true })));
      else resolve();
    }));
  });
  return built;
}

async function fixtureHTML() {
  const files = await fs.readdir(path.resolve('.next/static'), { recursive: true });
  const css = files.filter(file => file.endsWith('.css')).map(file => `<link rel="stylesheet" href="/_next/static/${file.split(path.sep).join('/')}">`).join('');
  return `<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width, initial-scale=1"><title>Fountain Gate UI test fixture</title>${css}</head><body><div id="root"></div><script src="/__ui_assets/ui.js"></script></body></html>`;
}
module.exports = { buildUIFixture, fixtureHTML };
