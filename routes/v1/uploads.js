const express = require("express");
const router = express.Router();
const passport = require("passport");
const winston = require("winston");
const sharp = require("sharp");


router.get("/:name", async function(req, res, next) {
    const fileName = `${__dirname}/../uploads/${req.params.name}`;
    if (fileName.includes("jpg")) {
      sharp(fileName)
        .rotate()
        .resize(800)
        .toBuffer()
        .then(fileBuffer => {
          return res.status(200).json({
            success: true,
            image: "data:image/jpeg;base64," + fileBuffer.toString("base64")
          });
        })
        .catch(err => {
          return res.status(500).json({ error: `${err}` });
        });
    } else if (fileName.includes("bz2")) {
      // the bz2 files
      res.sendFile(fileName, options, function(err) {
        if (err) {
          res.status(404).json({
            error: "no file"
          });
        } else {
          winston.log("info", "Sent:", fileName);
        }
      });
    }
  });
  
  module.exports = router;
