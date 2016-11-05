"use strict";

import * as _ from "underscore.string";
import * as path from "path";
import {global} from "../build.config";

module.exports = (gulp, $, config) => {
  var isProd = $.yargs.argv.stage === "prod";

  gulp.task("node:build", function () {
    var tsFilter = $.filter("**/*.ts");
    return gulp.src(config.appNodeScriptFiles)
      .pipe($.if(!isProd, $.sourcemaps.init()))
      .pipe(tsFilter)
      .pipe($.typescript(config.tsProject))
      .pipe(tsFilter.restore())
      .pipe($.if(!isProd, $.sourcemaps.write(".")))
      .pipe(gulp.dest(config.buildNodeJs))
  });

  // compile markup files and copy into build directory
  gulp.task("markup", function () {
    return gulp.src(config.appMarkupFiles)
      .pipe($.jade())
      .pipe(gulp.dest(config.buildDir));
  });

  // compile styles and copy into build directory
  gulp.task("styles", function () {
    return gulp.src(config.appStyleFiles)
      .pipe($.plumber({
        errorHandler: function (err) {
          $.notify.onError({
            title: "Error linting at " + err.plugin,
            subtitle: " ", // overrides defaults
            message: err.message.replace(/\u001b\[.*?m/g, ""),
            sound: " " // overrides defaults
          })(err);

          this.emit("end");
        }
      }))
      .pipe($.sass())
      .pipe($.autoprefixer())
      .pipe($.if(isProd, $.concat("app.css")))
      .pipe($.if(isProd, $.cssmin()))
      .pipe($.if(isProd, $.rev()))
      .pipe(gulp.dest(config.buildCss));
  });


  // compile scripts and copy into build directory
  gulp.task("scripts", ["analyze", "markup"], function () {
    var htmlFilter = $.filter("**/*.html")
      , jsFilter = $.filter("**/*.js")
      , tsFilter = $.filter("**/*.ts");

    return gulp.src([
      config.appScriptFiles,
      config.buildDir + "**/*.html",
      "!**/*_test.*",
      "!**/index.html"
    ])
      .pipe($.sourcemaps.init())
      .pipe(tsFilter)
      .pipe($.typescript(config.tsProject))
      .pipe(tsFilter.restore())
      .pipe($.if(isProd, htmlFilter))
      .pipe($.if(isProd, $.ngHtml2js({
        // lower camel case all app names
        moduleName: _.camelize(_.slugify(_.humanize(require("../package.json").name))),
        declareModule: false
      })))
      .pipe($.if(isProd, htmlFilter.restore()))
      .pipe(jsFilter)
      .pipe($.if(isProd, $.angularFilesort()))
      .pipe($.if(isProd, $.concat("app.js")))
      .pipe($.if(isProd, $.ngAnnotate()))
      .pipe($.if(isProd, $.uglify()))
      .pipe($.if(isProd, $.rev()))
      .pipe($.sourcemaps.write("."))
      .pipe(gulp.dest(config.buildJs))
      .pipe(jsFilter.restore());
  });

  // inject custom CSS and JavaScript into index.html
  gulp.task("inject", ["markup", "styles", "scripts"], function () {
    var jsFilter = $.filter("**/*.js");

    return gulp.src(config.buildDir + "index.html")
      .pipe($.inject(gulp.src([
          config.buildCss + "**/*",
          config.buildJs + "**/*"
        ])
          .pipe(jsFilter)
          .pipe($.angularFilesort())
          .pipe(jsFilter.restore()), {
          addRootSlash: false,
          ignorePath: config.buildDir
        })
      )
      .pipe(gulp.dest(config.buildDir));
  });

  gulp.task("bowerCopyCss", ["inject"], function () {
    var cssFilter = $.filter("**/*.css");
    return gulp.src($.mainBowerFiles(), {base: global.bowerDir})
      .pipe(cssFilter)
      .pipe($.if(isProd, $.modifyCssUrls({
        modify: function (url, filePath) {
          if (url.indexOf("http") !== 0 && url.indexOf("data:") !== 0) {
            filePath = path.dirname(filePath) + path.sep;
            filePath = filePath.substring(filePath.indexOf(global.bowerDir) + global.bowerDir.length,
              filePath.length);
          }
          url = path.normalize(filePath + url);
          url = url.replace(/[/\\]/g, "/");
          return url;
        }
      })))
      .pipe($.if(isProd, $.concat("vendor.css")))
      .pipe($.if(isProd, $.cssmin()))
      .pipe($.if(isProd, $.rev()))
      .pipe(gulp.dest(config.extDir))
  });

  gulp.task("bowerCopyAce", ["inject"], function () {
    var aceFilter = $.filter("ace-builds/**/*.js");
    return gulp.src($.mainBowerFiles(), {base: global.bowerDir})
      .pipe(aceFilter)
      .pipe(gulp.dest(config.extDir));
  });

  // copy bower components into build directory
  gulp.task("bowerCopy", ["inject", "bowerCopyCss", "bowerCopyAce"], function () {
    var jsNoAceFilter = $.filter(["**/*.js", "!ace-builds/**"]);
    return gulp.src($.mainBowerFiles(), {base: global.bowerDir})
      .pipe(jsNoAceFilter)
      .pipe($.if(isProd, $.concat("vendor.js")))
      .pipe($.if(isProd, $.uglify({
        preserveComments: $.uglifySaveLicense
      })))
      .pipe($.if(isProd, $.rev()))
      .pipe(gulp.dest(config.extDir));
  });

  // inject bower components into index.html
  gulp.task("bowerInject", ["bowerCopy"], function () {
    if (isProd) {
      return gulp.src(config.buildDir + "index.html")
        .pipe($.inject(gulp.src([
          config.extDir + "vendor*.css",
          config.extDir + "**/ace-builds/**/*ace.js",
          config.extDir + "vendor*.js",
          config.extDir + "**/ace-builds/**/mode-**.js"
        ], {
          read: false
        }), {
          starttag: "<!-- bower:{{ext}} -->",
          endtag: "<!-- endbower -->",
          addRootSlash: false,
          ignorePath: config.buildDir
        }))
        .pipe($.htmlmin({
          collapseWhitespace: true,
          removeComments: true
        }))
        .pipe(gulp.dest(config.buildDir));
    } else {
      return gulp.src(config.buildDir + "index.html")
        .pipe($.wiredep.stream({
          ignorePath: "../../" + global.bowerDir.replace(/\\/g, "/"),
          fileTypes: {
            html: {
              replace: {
                css: function (filePath) {
                  return "<link rel='stylesheet' href='" + config.extDir.replace(config.buildDir, "") +
                    filePath + "'>";
                },
                js: function (filePath) {
                  return "<script src='" + config.extDir.replace(config.buildDir, "") +
                    filePath + "'></script>";
                }
              }
            }
          }
        }))
        .pipe(gulp.dest(config.buildDir));
    }
  });

  gulp.task("copyTemplates", ["bowerInject"], function () {
    // always copy templates to testBuild directory
    var stream = $.streamqueue({objectMode: true});

    stream.queue(gulp.src([config.buildDirectiveTemplateFiles]));

    return stream.done()
      .pipe(gulp.dest(config.buildTestDirectiveTemplatesDir));
  });

  gulp.task("frontend:build", ["copyTemplates"]);

  gulp.task("build", ["node:build", "frontend:build"]);

};
