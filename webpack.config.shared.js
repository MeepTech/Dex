const path = require('path');

module.exports = (env = {}) => ({
  entry: path.resolve(__dirname, 'src', "lib.ts"),
  output: {
    path: path.resolve(__dirname, 'build', env.dev ? "dev" : "prod"),
    filename: 'lib.js',
    library: 'Dex',
    libraryTarget: 'umd',
    globalObject: 'this'
  },
  resolve: {
    extensions: ['.ts', 'js'],
    modules: [
        path.resolve(__dirname, 'node_modules'),
        path.resolve(__dirname, 'src'),
    ]
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        include: path.resolve(__dirname, 'src', 'lib.ts'),
        use: [
          // lib.ts => lib.js
          { loader: 'babel-loader' }
        ]
      },
      {
        test: /\.ts$/,
        include: path.resolve(__dirname, 'src'),
        use: [
          // *.ts => *.d.ts
          {
            loader: 'ts-loader', options: {
            configFile: path.resolve(
              __dirname,
              !env.dev
                ? 'tsconfig.prod.json'
                : 'tsconfig.dev.json')
          }},
          // lib.ts => lib.js
          { loader: 'babel-loader' }
        ]
      }
    ]
  }
});

/**
 * ts-loader emits an error when no output is generated. This occurs when using Typescript's emitDeclarationOnluy
 * flag. This plugin suppresses that error so that webpack will consider it a clean build.
 * 
 * source: https://stackoverflow.com/a/70994678
 */
class EmitDeclarationOnly {
  apply(compiler) {
      compiler.hooks.shouldEmit.tap('EmitDeclarationOnly', (compilation) => this.handleHook(compiler, compilation));
  }
  handleHook(compiler, compilation){
      compilation.errors = compilation.errors.filter((error) => {!error.toString().includes("TypeScript emitted no output for")});
  }
}