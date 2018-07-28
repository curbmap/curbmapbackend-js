const express = require("express");
const router = express.Router();
const passport = require("passport");
const winston = require("winston");
const { LEVELS } = require("../constants");
const { findExists } = require("../utils");
const mongooseModels = require("../../model/mongooseModels.js");

router.post("/up", passport.authenticate("jwt", { session: false }), function(
  req,
  res,
  next
) {
  if (findExists(req.user.role, LEVELS.user)) {
    return next();
  } else {
    return res.status(200).json({
      success: true,
      comment:
        "As a testing user we are unable to calculate statistics for the value of a downvote"
    });
  }
  // TODO: MUST WRITE up Voting of restriction
});

router.post("/down", passport.authenticate("jwt", { session: false }), function(
  req,
  res,
  next
) {
  if (findExists(req.user.role, LEVELS.user)) {
    winston.log("info", "downVote", {
      body: req.body,
      headers: req.header
    });
    // TODO: MUST WRITE Down Voting of restriction
  } else {
    res.status(200).json({
      success: true,
      comment:
        "As a testing user we are unable to calculate statistics for the value of a downvote"
    });
  }
});

module.exports = router;
