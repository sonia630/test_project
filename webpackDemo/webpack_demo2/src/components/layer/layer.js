// import tpl from './layer.html'

import './layer.less';
import tpl from './layer.tpl';
import logo from '../../assets/images/logo.png'

function layer(){
	console.log("this is layer..");
	return {
		name:'layer',
		tpl:tpl
	}

}

export default layer;