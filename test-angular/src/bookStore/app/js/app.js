var bookStoreApp = angular.module("bookStoreApp",[
	"ngRoute","ngAnimate",
	"bookStoreCtrls",
	 
	"bookStoreDirectives",
	"bookStoreFilters",
	"bookStoreServices", 
	
])

bookStoreApp.config(function($routeProvider){
	$routeProvider.when("/hello",{
		templateUrl:"tpls/hello.html",
		controller:"HelloCtrl"
	}).when("/list",{
		templateUrl:"tpls/bookList.html",
		controller:"BookListCtrl"
	}).otherwise({
		redirectTo:"/hello"})

})		

