const fs = require("fs");
const express = require("express");
const router = express.Router();
const passport = require("passport");
const winston = require("winston");
const db = require("../../models");
const multer = require("multer");
const mongooseModels = require("../../model/mongooseModels.js");
const { MAX_FILE_SIZE, LEVELS } = require("../constants");
const { findExists } = require("../utils");

const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function(req, file, cb) {
    cb(null, req.user.id + "-" + Date.now());
  }
});

const upload = multer({
  limits: {
    fileSize: MAX_FILE_SIZE
  },
  storage: storage
});

router.post(
  "/upload",
  passport.authenticate("jwt", { session: false }),
  upload.single("image"),
  async function(req, res, next) {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, error: "Image was not uploaded" });
    } else if (findExists(req.user.role, LEVELS.test)) {
      let newFilePath = req.file.path;
      try {
        if (!req.file) {
          return res.status(400).json({
            success: false
          });
        } else if (
          req.file.size < 10000 ||
          req.body.olc == null ||
          req.body.olc === "" ||
          req.body.deviceType == null ||
          req.body.deviceType === ""
        ) {
          fs.unlinkSync(newFilePath);
          res.status(400).json({
            success: false,
            error: "file or olc error"
          });
        } else {
          if (req.body.bearing == null || req.body.bearing === "") {
            req.body.bearing = 0.0;
          }
          const filePath = req.file.path
          const olc = req.body.olc
          const bearing = req.body.bearing
          newFilePath = `${filePath}-${olc}-${bearing}.jpg`
          fs.renameSync(req.file.path, newFilePath);
          let user_photos = await db.curbmap_user_photo.findOne({
            where: { userid: req.user.id }
          });
          const photoObject = { filename: newFilePath, olc: req.body.olc };
          if (user_photos == null) {
            user_photos = await db.curbmap_user_photo.build({
              photos: [JSON.stringify(photoObject)],
              userid: req.user.id
            });
            await user_photos.save();
          } else {
            try {
              await db.curbmap_user_photo.update(
                {
                  photos: db.sequelize.fn(
                    "array_append",
                    db.sequelize.col("photos"),
                    JSON.stringify(photoObject)
                  )
                },
                { where: { userid: req.user.id } }
              );
            } catch (err) {
              console.log(err);
            }
          }
          let photo = new mongooseModels.photos({
            userid: req.user.id,
            filename: newFilePath,
            date: Date(),
            size: req.file.size,
            classifications: [],
            deviceType: req.body.deviceType,
            bearing: req.body.bearing,
            olc: req.body.olc
          });
          await photo.save();
          res.status(200).json({
            success: true
          });
        }
      } catch (e) {
        fs.unlinkSync(newFilePath);
        res.status(500).json({
          success: false,
          error: e
        });
      }
    } else {
      fs.unlinkSync(req.file.path);
      if (req.user.role === "ROLE_SANDBOX") {
        res.status(200).json({
          success: true,
          info:
            "Had you been a registered user you could have submitted an image as a binary string and it would have been processed. Thank you!"
        });
      } else {
        res.status(401).json({
          success: false
        });
      }
    }
  }
);
module.exports = router;
