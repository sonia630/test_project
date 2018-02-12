var userInfoModule = angular.module("UserInfoModule",[])
userInfoModule.controller("UserInfoCtrl",["$scope",function($scope){
	$scope.userInfo = {
		email:"yongtali@cisco.com",
		password:"123456",
		autoLogin:true
	};
	$scope.getFormData = function(){
		console.log($scope.userInfo)
	}
	$scope.setFormData = function(){
		$scope.userInfo = {
			email:"yongtali@126.com",
			password:"4566",
			autoLogin:false
		}
	}
	$scope.resetFormData = function(){
		$scope.userInfo = {
			email:"",
			password:"",
			autoLogin:false
		}
	}
}])