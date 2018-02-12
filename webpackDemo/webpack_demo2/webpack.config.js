const path = require('path');
const htmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
	entry:'./src/app.js',
	output:{
		path: path.resolve(__dirname, 'dist'),
		filename:'js/[name].bundle.js'
	},
	module:{
		loaders:[
			{
				test:/\.js$/,
				loader:'babel-loader',
				exclude:path.resolve(__dirname,'node_modules'),
				include:path.resolve(__dirname,'src'),
				query:{
					presets:[ "latest"]
				}
			},{
				test:/\.html$/,
				loader:'html-loader'
			},{
				test:/\.tpl$/,
				loader:'ejs-loader'
			},{
				test:/\.css$/,
				loader:'style-loader!css-loader?importLoaders=1!postcss-loader'
			},{
				test:/\.less$/,
				loader:'style-loader!css-loader!postcss-loader!less-loader'
			},{
				test:/\.scss$/,
				loader:'style-loader!css-loader!postcss-loader!sass-loader'
			},{
				test:/\.(png|jpg|gif|svg)$/i,
				loaders:[
						'url-loader?limit:20000&name: [path][name]-[hash:5].[ext]',
						'image-webpack-loader'
				 		]
				/*
				options: {
					limit:20000,
				    name: '[path][name]-[hash:5].[ext]',
				  }*/
			}

		]
	},
	plugins:[
		new htmlWebpackPlugin({
			filename:'index.html',
			template:'index.html',
			inject:'body',
			title:'this is test'
		})
	]
}