const path = require("path");
const slsw = require("serverless-webpack");
const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");
const webpack = require("webpack");

module.exports = {
  context: __dirname,
  mode: slsw.lib.webpack.isLocal ? "development" : "production",
  entry: slsw.lib.entries,
  devtool: slsw.lib.webpack.isLocal
    ? "cheap-module-eval-source-map"
    : "source-map",
  resolve: {
    // Added '.js' so webpack can resolve internal JS files within dependencies now that we bundle them.
    extensions: [".mjs", ".js", ".json", ".ts"],
    symlinks: false,
    cacheWithContext: false,
  },
  output: {
    libraryTarget: "commonjs",
    path: path.join(__dirname, ".webpack"),
    filename: "[name].js",
  },
  target: "node",
  // Bundle all modules except the AWS SDK (already present in Lambda runtime).
  externals: [{ "aws-sdk": "commonjs aws-sdk" }],
  externals: [
    { "aws-sdk": "commonjs aws-sdk" },
    // Treat optional CRT-based signing packages as externals (they are conditionally required).
    { "aws-crt": "commonjs aws-crt" },
    { "@aws-sdk/signature-v4-crt": "commonjs @aws-sdk/signature-v4-crt" },
  ],
  module: {
    rules: [
      // all files with a `.ts` or `.tsx` extension will be handled by `ts-loader`
      {
        test: /\.(tsx?)$/,
        loader: "ts-loader",
        exclude: [
          [
            path.resolve(__dirname, "node_modules"),
            path.resolve(__dirname, ".serverless"),
            path.resolve(__dirname, ".webpack"),
            path.resolve(__dirname, "../../node_modules"),
          ],
        ],
        options: {
          transpileOnly: true,
          experimentalWatchApi: true,
        },
      },
    ],
  },
  plugins: [
    // Ignore optional native CRT module so Webpack does not warn about missing dependency.
    new webpack.IgnorePlugin({ resourceRegExp: /^aws-crt$/ }),
    new webpack.IgnorePlugin({ resourceRegExp: /@aws-sdk\/signature-v4-crt/ }),
    // Uncomment for type checking during local development.
    // new ForkTsCheckerWebpackPlugin({})
  ],
};
