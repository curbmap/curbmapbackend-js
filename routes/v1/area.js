const express = require("express");
const router = express.Router();
const passport = require("passport");
const winston = require("winston");
const mongooseModels = require("../../model/mongooseModels.js");
const geolib = require("geolib");
const OpenLocationCode = require("open-location-code").OpenLocationCode;
const openLocationCode = new OpenLocationCode();
const { LEVELS } = require("../constants");
const { processResults, findExists } = require("../utils");

router.get(
  "/olc",
  passport.authenticate("jwt", { session: false }),
  async function(req, res, next) {
    const time_start = new Date().getTime();
    if (
      findExists(req.user.role, LEVELS.sandbox) &&
      req.query.code !== undefined &&
      req.query.code.length == 9 &&
      req.query.code[7] !== "0" // make sure no padding values which is valid but not useful
    ) {
      try {
        const area = openLocationCode.decode(req.query.code);
        const lng1 = area.longitudeLo;
        const lat1 = area.latitudeLo;
        const lng2 = area.longitudeHi;
        const lat2 = area.latitudeHi;
        const user = req.query.user;
        const lower = [lng1, lat1];
        const upper = [lng2, lat2];
        // diagonal distance in the view
        if (user !== undefined && user === req.user.username) {
          var query = mongooseModels.parents.find({
            loc: {
              $geoIntersects: {
                $geometry: {
                  type: "Polygon",
                  coordinates: [
                    [
                      [lower[0], lower[1]],
                      [lower[0], upper[1]],
                      [upper[0], upper[1]],
                      [upper[0], lower[1]],
                      [lower[0], lower[1]]
                    ]
                  ]
                }
              }
            },
            "lines.restrs": {
              $elemMatch: {
                by: req.user.id
              }
            }
          });
          query.exec(function(err, result) {
            try {
              let results_to_send;
              results_to_send = processResults(result, true);
              res.status(200).json(results_to_send);
            } catch (e) {
              winston.log("warn", "error", e);
            }
          });
        } else {
          var query = mongooseModels.parents.find({
            loc: {
              $geoIntersects: {
                $geometry: {
                  type: "Polygon",
                  coordinates: [
                    [
                      [lower[0], lower[1]],
                      [lower[0], upper[1]],
                      [upper[0], upper[1]],
                      [upper[0], lower[1]],
                      [lower[0], lower[1]]
                    ]
                  ]
                }
              }
            }
          });
          query.exec(function(err, result) {
            try {
              const time_end_results = new Date().getTime();
              winston.log("warn", "time elapsed in mongo", {
                results_from_mongo: result.length,
                time: time_end_results - time_start
              });
              // winston.log('info', util.inspect(result, {depth: null}));
              let results_to_send;
              if (req.query.code.length >= 11) {
                results_to_send = processResults(result, true);
              } else {
                results_to_send = processResults(result, false);
              }
              res.status(200).json(results_to_send);
              const time_end = new Date().getTime();
              winston.log("warn", "time elapsed in processing", {
                results_length: results_to_send.length,
                time: time_end - time_end_results
              });
            } catch (e) {
              winston.log("info", "error in query", e);
            }
          });
        }
      } catch (e) {
        winston.log("info", "Error: " + e);
        res.json({ error: e });
      }
    } else {
      res.json({ error: "error" });
    }
  }
);

router.get(
  "/polygon",
  passport.authenticate("jwt", { session: false }),
  function(req, res, next) {
    const time_start = new Date().getTime();
    if (
      findExists(req.user.role, LEVELS.sandbox) &&
      req.query.lat1 !== undefined &&
      req.query.lat2 !== undefined &&
      req.query.lng1 !== undefined &&
      req.query.lng2 !== undefined
    ) {
      try {
        const lng1 = parseFloat(req.query.lng1);
        const lat1 = parseFloat(req.query.lat1);
        const lng2 = parseFloat(req.query.lng2);
        const lat2 = parseFloat(req.query.lat2);
        const user = req.query.user;
        const lower = [lng1, lat1];
        const upper = [lng2, lat2];
        const distance = geolib.getDistance(
          {
            longitude: lower[0],
            latitude: upper[1]
          },
          {
            longitude: upper[0],
            latitude: upper[1]
          }
        ); // keep the distance to one dimension

        // diagonal distance in the view
        if (user !== undefined && user === req.user.username) {
          var query = mongooseModels.parents.find({
            loc: {
              $geoIntersects: {
                $geometry: {
                  type: "Polygon",
                  coordinates: [
                    [
                      [lower[0], lower[1]],
                      [lower[0], upper[1]],
                      [upper[0], upper[1]],
                      [upper[0], lower[1]],
                      [lower[0], lower[1]]
                    ]
                  ]
                }
              }
            },
            "lines.restrs": {
              $elemMatch: {
                b: req.user.id
              }
            }
          });
          query.exec(function(err, result) {
            try {
              let results_to_send;
              results_to_send = processResults(result, true);
              res.status(200).json(results_to_send);
            } catch (e) {
              winston.log("warn", "error", e);
            }
          });
        } else if (distance < 3000) {
          var query = mongooseModels.parents.find({
            loc: {
              $geoIntersects: {
                $geometry: {
                  type: "Polygon",
                  coordinates: [
                    [
                      [lower[0], lower[1]],
                      [lower[0], upper[1]],
                      [upper[0], upper[1]],
                      [upper[0], lower[1]],
                      [lower[0], lower[1]]
                    ]
                  ]
                }
              }
            }
          });
          query.exec(function(err, result) {
            try {
              const time_end_results = new Date().getTime();
              winston.log("warn", "time elapsed in mongo", {
                results_from_mongo: result.length,
                time: time_end_results - time_start
              });
              let results_to_send;
              if (distance < 1200) {
                results_to_send = processResults(result, true);
              } else {
                results_to_send = processResults(result, false);
              }
              res.status(200).json(results_to_send);
              const time_end = new Date().getTime();
              winston.log("warn", "time elapsed in processing", {
                results_length: results_to_send.length,
                time: time_end - time_end_results
              });
            } catch (e) {
              winston.log("info", "error in query", e);
            }
          });
        }
      } catch (e) {
        winston.log("info", "Error: " + e);
        res.json({});
      }
    } else {
      res.json({});
    }
  }
);
module.exports = router;
