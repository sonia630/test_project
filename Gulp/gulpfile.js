var fs        = require('fs');
var path      = require('path');
var gulp      = require('gulp');

 
gulp.task('vue', function() {
    return gulp.src('./components/libs/vue/**/*.vue')
                .pipe(VueModule({
                    debug : true
                }))
                .pipe(rename({extname : ".js"}))
                .pipe(gulp.dest("./dist"));
});
 
gulp.task('default', ['vue']);
