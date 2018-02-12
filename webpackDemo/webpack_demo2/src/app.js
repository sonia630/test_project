import css from './css/common.css';
import Layer from './components/layer/layer.js';

//ES6 语法
const App = function(){
	var dom = document.getElementById('app');
	console.log("dom",dom);
	var layer = new Layer();
	console.log("tpl",layer.tpl);
	dom.innerHTML = layer.tpl;

	dom.innerHTML = layer.tpl({
		name:'join',
		arr:['apple','aaa','bbb','ccc']
	})

}



new App();