//定义一个
//module
//
var myModule = angular.module("HelloAngular",[]);
myModule.directive("hello",function(){
	return{
		restrict:"E",
		template:"<div>Hi module</div>",
		replace:true
	}
})

