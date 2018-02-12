const path = require('path');
const htmlWebpackPlugin = require('html-webpack-plugin')

module.exports={
	entry:{
		main:'./src/script/main.js',
		a:'./src/script/a.js',
		b:'./src/script/b.js',
		c:'./src/script/c.js',
	},
	output:{
		path:path.resolve(__dirname, 'dist'),
		filename:'js/[name]-[chunkhash].js',
		publicPath:'http://cdn.com/'
	},
	plugins:[
		new htmlWebpackPlugin({
			template:'index.html',
			filename:'a.html', //index-[hash].html
			inject: 'body',//false,//'head',
			title:'this is a.html',
			date: new Date(),
			chunks:['main','a']
			// minify:{
			// 	removeComments: true,
			// 	collapseWhitespace: true,
			// }
		}),
		new htmlWebpackPlugin({
			template:'index.html',
			filename:'b.html', //index-[hash].html
			inject: 'body',//false,//'head',
			title:'this is b.html',
			date: new Date(),
			chunks:['b']
			// minify:{
			// 	removeComments: true,
			// 	collapseWhitespace: true,
			// }
		}),
		new htmlWebpackPlugin({
			template:'index.html',
			filename:'c.html', //index-[hash].html
			inject: false,//'body',//false,//'head',
			title:'this is c.html',
			date: new Date(),
			excludeChunks:['a']
			// minify:{
			// 	removeComments: true,
			// 	collapseWhitespace: true,
			// }
		}),
	]
}