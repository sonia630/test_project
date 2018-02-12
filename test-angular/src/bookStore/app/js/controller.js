var bookStoreCtrls = angular.module("bookStoreCtrls",[]);
bookStoreCtrls.controller('HelloCtrl', ['$scope', function($scope){
	$scope.greeting = {
		text:"hello angular"
	}
}])
 
bookStoreCtrls.controller('BookListCtrl', ['$scope', function($scope){
	$scope.books = [
		{title:"java",author:"author java"},
		{title:"c",author:"author c"},
		{title:"c++",author:"author c++"},
		{title:"java3",author:"author java3"},
	]
}]) 