const path = require('path');

module.exports = {
  entry: { 'hello-world': './src/handlers/hello-world.ts' },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  output: {
    libraryTarget: 'commonjs2',
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
  },
  target: 'node',
};
