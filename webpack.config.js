const path = require('path');
module.exports = {
	entry: "./index.ts",
	// devtool: 'inline-source-map',
	devtool: false,
	optimization: {
		minimize: false
	},
	output: {
		filename: "bundle.js",
		path: path.resolve(__dirname, 'dist'),
	},
	resolve: {
		extensions: [".ts", ".js"]
	},
	module: {
		rules: [{ test: /\.ts$/, loader: "ts-loader" }]
	},
	// plugins: [
	// 	new SourceMapDevToolPlugin({
	// 		test: [/.*\.js/],
	// 		filename: '[file].map',
	// 		// noSources: false
	// 		// module: false,
	// 		// columns: false,
	// 		// noSources: true,
	// 		// sourceRoot: 'src',
	// 		// fileContext: 'src',
	// 		publicPath: 'http://test/'
	// 	}),
	// ]
}
