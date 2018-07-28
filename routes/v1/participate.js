/* "use strict"; */
const fs = require("fs");
const express = require("express");
const router = express.Router();
const sharp = require("sharp");
const mongooseModels = require("../../model/mongooseModels.js");
const passport = require("passport");
const winston = require("winston");
const { LEVELS } = require("../constants");
const { findExists } = require("../utils");

router.get(
    "/image",
    passport.authenticate("jwt", { session: false }),
    async function(req, res, next) {
    console.log("NEXT");
    if (findExists(req.user.role, LEVELS.user)) {
      try {
        let avail = await mongooseModels.photos.aggregate([
          {
            $match: { "classifications.userid": { $nin: [req.user.id] } }
          }
        ]);
        if (avail.length === 0) {
          res.status(200).json({ success: false, error: "no more photos" });
        } else {
          let randomImage = Math.round(Math.random() * avail.length);
          let i = 0;
          while (
            randomImage >= avail.length ||
            !fs.existsSync(__dirname + "/../../" + avail[randomImage].filename)
          ) {
            if (i >= 50) {
              return res
                .status(404)
                .json({ success: false, error: "no more photos" });
            }
            if (randomImage < avail.length) {
              //   remove the image from the DB and from the aggregation with slice
              //   await mongooseModels.photos.remove({
              //    _id: avail[randomImage]._id
              //   });
              avail.splice(randomImage, 1);
            }
            if (avail.length === 0) {
              return res
                .status(404)
                .json({ success: false, error: "no more photos" });
            }
            // pick a new number, hopefully from the values we actually have in the list
            randomImage = Math.round(Math.random() * avail.length);
            console.log(i, randomImage);
            i += 1;
          }
          sharp(__dirname + "/../../" + avail[randomImage].filename)
            .rotate()
            .resize(800)
            .toBuffer()
            .then(fileBuffer => {
              let id = avail[randomImage]._id.toString();
              return res.status(200).json({
                success: true,
                image:
                  "data:image/jpeg;base64," + fileBuffer.toString("base64"),
                id: id
              });
            })
            .catch(err => {
              return res
                .status(500)
                .json({ error: `No file or error: ${err}` });
            });
        }
      } catch (error) {
        winston.log("error", "oops error for userid:", req.user.id, error);
      }
    } else {
      if (req.user.role === "ROLE_SANDBOX") {
        return res.status(200).json({
          success: true,
          image: "image bas64 string",
          id: "imageid",
          comment: "You would normally be returned an image"
        });
      }
    }
  }
);

module.exports = router;
