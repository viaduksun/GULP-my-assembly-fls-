
// const project_folder = "dist";
const project_folder = require('path').basename(__dirname);
const source_folder = '#src';
const fs = require("fs");
const path = {
  build: {
    html: project_folder + '/',
    css: project_folder + '/css/',
    js: project_folder + '/js/',
    img: project_folder + '/img/',
    fonts: project_folder + '/fonts/',
  },
  src: {
    html: [source_folder + '/*.html', '!' + source_folder + '/_*.html'],
    css: source_folder + '/scss/style.scss',
    js: source_folder + '/js/script.js',
    img: source_folder + '/img/**/*.{jpg,png,gif,svg,ico,webp}',
    fonts: source_folder + '/fonts/*.ttf',
  },
  watch: {
    html: source_folder + '/**/*.html',
    css: source_folder + '/scss/**/*.scss',
    js: source_folder + '/js/**/*.js',
    img: source_folder + '/img/**/*.{jpg,png,gif,svg,ico,webp}',
    fonts: source_folder + '/fonts/*.ttf',
  },
  clean: './' + project_folder + '/'
};
// =============ПЕРЕМЕННЫЕ============
const { src, dest } = require('gulp');
// для отдельных задач переменная gulp
const gulp = require('gulp');
const browsersync = require('browser-sync').create();
const fileinclude = require('gulp-file-include');
const delfiles = require('del');
const scss = require('gulp-sass');
const autoprefixer = require('gulp-autoprefixer');
const group_media = require('gulp-group-css-media-queries');
const css_cleaner = require('gulp-clean-css');
const gulp_rename = require('gulp-rename');
const gulp_uglify = require('gulp-uglify-es').default;
const imagemin = require('gulp-imagemin');
const webp = require('gulp-webp');
const webphtml = require('gulp-webp-html');
const webpcss = require('gulp-webpcss');
const svgsprite = require('gulp-svg-sprite');
const gulpttf2woff = require('gulp-ttf2woff');
const gulpttf2woff2 = require('gulp-ttf2woff2');
const gulpFonter = require('gulp-fonter');
// =========================FUNC========================================
// функция обновления браузера
function browserSync(params) {
  browsersync.init({
    server: {
      baseDir: './' + project_folder + '/'
    },
    port: 3000,
    notify: false
  });
}
function html() {
  // обращаемся к исходникам
  return src(path.src.html)
    // подключаем работу плагина сборки модулей
    .pipe(fileinclude())
    .pipe(webphtml())
    // выгружаем в конечную папку
    .pipe(dest(path.build.html))
    // обновляем браузер
    .pipe(browsersync.stream());
}
function images() {
  // обращаемся к исходникам
  return src(path.src.img)
    .pipe(webp({
      quality: 70
    }))
    // выгружаем в конечную папку
    .pipe(dest(path.build.img))
    .pipe(src(path.src.img))
    .pipe(imagemin({
      progressive: true,
      svgoPlugins: [{ removeViewBox: false }],
      interlaced: true,
      optimizationLevel: 3 //0 to 7
    }))
    // выгружаем в конечную папку
    .pipe(dest(path.build.img))
    // обновляем браузер
    .pipe(browsersync.stream());
}
function js() {
  // обращаемся к исходникам
  return src(path.src.js)
    // подключаем работу плагина сборки модулей
    .pipe(fileinclude())
    // выгружаем в конечную папку
    .pipe(dest(path.build.js))
    // сжимаем JS
    .pipe(gulp_uglify())
    // переименовываем
    .pipe(gulp_rename({ extname: '.min.js' }))
    // выгружаем в конечную папку min js
    .pipe(dest(path.build.js))
    // обновляем браузер
    .pipe(browsersync.stream());
}
function css() {
  return src(path.src.css)
    .pipe(scss({
      outputStyle: 'expanded'
    })
    )
    .pipe(
      autoprefixer({
        overrideBrowserslist: ['last 5 versions'],
        cascade: true
      })
    )
    .pipe(webpcss({
      webpClass: '.webp',
      noWebpClass: '.no-webp'
    }))
    .pipe(group_media())
    // выгружаем в конечную папку не сжатый файл
    .pipe(dest(path.build.css))
    // сжимаем css
    .pipe(css_cleaner())
    .pipe(gulp_rename({ extname: '.min.css' }))
    // выгружаем в конечную папку min css
    .pipe(dest(path.build.css))
    // обновляем браузер
    .pipe(browsersync.stream());
}
function fonts() {
  src(path.src.fonts)
    .pipe(gulpttf2woff())
    .pipe(dest(path.build.fonts));
  return src(path.src.fonts)
    .pipe(gulpttf2woff2())
    .pipe(dest(path.build.fonts))
}
// =================================================================
// Отдельная задача для создания файла-спрайта с иконками
gulp.task('svgsprite', function () {
  return gulp.src([source_folder + '/iconsprite/*.svg'])
    .pipe(svgsprite({
      mode: {
        stack: {
          sprite: '../icons/icons.svg',
          example: true,
        }
      }
    }))
    .pipe(dest(path.build.img))
})
// Конвертация шрифтов 
gulp.task('otf2ttf', function () {
  return gulp.src([source_folder + '/fonts/*.otf'])
    .pipe(gulpFonter({
      formats: ['ttf']
    }))
    .pipe(dest(source_folder + '/fonts/'))
})

// =================================================================
function fontsStyle(params) {

  let file_content = fs.readFileSync(source_folder + '/scss/fonts.scss');
  if (file_content == '') {
    fs.writeFile(source_folder + '/scss/fonts.scss', '', cb);
    return fs.readdir(path.build.fonts, function (err, items) {
      if (items) {
        let c_fontname;
        for (var i = 0; i < items.length; i++) {
          let fontname = items[i].split('.');
          fontname = fontname[0];
          if (c_fontname != fontname) {
            fs.appendFile(source_folder + '/scss/fonts.scss', '@include font("' + fontname + '", "' + fontname + '", "400", "normal");\r\n', cb);
          }
          c_fontname = fontname;
        }
      }
    })
  }
}

function cb() { }
// функция прослушки (слежки) за файлами
function watchFiles() {
  // прописываем пути к файлам html и указываем функцию обработки
  gulp.watch([path.watch.html], html);
  gulp.watch([path.watch.css], css);
  gulp.watch([path.watch.js], js);
  gulp.watch([path.watch.img], images);
}

function clean() {
  return delfiles(path.clean);
}


// =============СЦЕНАРИЙ ВЫПОЛНЕНИЯ==============================
// gulp.parallel(css, html) - для параллельной обработки стилей и html
const build = gulp.series(clean, gulp.parallel(js, css, html, images, fonts), fontsStyle);
const watch = gulp.parallel(build, watchFiles, browserSync);


exports.fontsStyle = fontsStyle;
exports.fonts = fonts;
exports.images = images;
exports.js = js;
exports.css = css;
exports.build = build;
exports.html = html;
exports.watch = watch;
exports.default = watch;