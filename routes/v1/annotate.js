const express = require("express");
const router = express.Router();
const passport = require("passport");
const winston = require("winston");
const mongooseModels = require("../../model/mongooseModels.js");
const { LEVELS } = require("../constants");
const { constructBoxesFrom, findExists } = require("../utils");

router.post(
  "/",
  passport.authenticate("jwt", { session: false }),
  async function(req, res, next) {
    if (findExists(req.user.role, LEVELS.user)) {
      try {
        let photo = await mongooseModels.photos.findOne({
          _id: mongooseModels.obj_id(req.body.id)
        });
        photo.classifications.push({
          userid: req.user.id,
          type: 0,
          boxes: constructBoxesFrom(req.body.boxes),
          content: [],
          date: new Date(),
          verified: false
        });
        await photo.save();
        res.status(200).json({ success: true });
      } catch (err) {
        res.status(500).json({ success: false });
      }
    } else {
      return res.status(200).json({
        success: true,
        comment:
          "Normally, out of the sandbox you would have been able to add data for bounding boxes and labels."
      });
    }
  }
);

module.exports = router;
