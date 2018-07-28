const express = require("express");
const router = express.Router();
const passport = require("passport");
const winston = require("winston");
const swaggerUi = require("swagger-ui-express");
const YAML = require('yamljs');
const v1docs = YAML.load(__dirname+'/v1.openapi.yml');

const area = require("./area");
const image = require("./image");
const vote = require("./vote");
const add = require("./add");
const annotation = require("./annotate");
const respond = require("./respond");
const participate = require("./participate");
router.use("/add", add);
router.use("/annotate", annotation);
router.use("/area", area);
router.use("/image", image);
router.use("/participate", participate);
router.use("/respond", respond);
router.use("/vote", vote);
router.use("/api", swaggerUi.serve, swaggerUi.setup(v1docs));

module.exports = router;
