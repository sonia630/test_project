//ng-app="HelloAngular1" 只有一个app
var myModule = angular.module("HelloAngular1",[]);

//对页面的渲染
myModule.controller("HelloAngular",["$scope",
	function HelloAngular($scope){
		$scope.greeting={
			text:"hello Angular",
 
		}
	}
])

//指令系统
myModule.directive("hello",function(){
	return{
		restrict:"E",
		template:"<div>Hi module</div>",
		replace:true
	}
})

//可以有多个controller
myModule.controller("helloController",["$scope",
	function helloController($scope){
		$scope.greeting = {
			text:"hello controller"
	}
}
])

//通用
function CommonController($scope){
	$scope.commonFn = function(){
		console.log("这个是通用功能")
	}
}

//
function Controller1($scope){
	$scope.greeting = {
		text:"hello1"
	}
	$scope.test1 = function(){
		console.log("test1")
	}
}


function Controller2($scope){
	$scope.greeting = {
		text:"hello2"
	}
	$scope.test2 = function(){
		console.log("test2")
	}
}




















