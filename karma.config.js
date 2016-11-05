"use strict";
var c = require("./build.config"),
  buildConfig = c.config,
  preprocessors = {},
  buildTestDir, templateDir
  , jsDir;

buildTestDir = buildConfig.buildTestDir;
// add slash if missing to properly strip prefix from directive templates
if (buildTestDir[buildTestDir.length - 1] !== "/") {
  buildTestDir = buildTestDir + "/";
}
templateDir = buildTestDir + "templates/";

jsDir = buildConfig.buildJs;
// add slash if missing to properly strip prefix from directive templates
if (jsDir[jsDir.length - 1] !== "/") {
  jsDir = jsDir + "/";
}

preprocessors[templateDir + "**/*-directive.tpl.html"] = ["ng-html2js"];

module.exports = {
  browsers: ["PhantomJS"],
  frameworks: ["jasmine", "sinon"],
  reporters: ["html", "failed"],
  preprocessors: preprocessors,
  ngHtml2JsPreprocessor: {
    stripPrefix: templateDir
  },
  autoWatch: false,
  singleRun: true
};
