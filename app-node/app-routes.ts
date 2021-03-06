"use strict";

import {topicRouter} from "./topic/topic-routes";

var express = require("express");
export var appRouter = express.Router();

appRouter.use("/topics", topicRouter);
appRouter.use("/users", require("./user/user-routes"));
appRouter.use("/login", require("./login/login-routes"));

module.exports = appRouter;

