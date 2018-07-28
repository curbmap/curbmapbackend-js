const express = require("express");
const router = express.Router();
const passport = require("passport");
const winston = require("winston");
const db = require("../../models");
const mongooseModels = require("../../model/mongooseModels.js");
const { LEVELS } = require("../constants");
const { checkRestr, findExists } = require("../utils");

router.post(
  "/line",
  passport.authenticate("jwt", { session: false }),
  async function(req, res, next) {
    if (
      typeof req.body.line !== "object" ||
      req.body.line.length < 2 || // start & end points must exist for line to exist
      typeof req.body.restrictions !== "object" ||
      req.body.restrictions.length == 0
    ) {
      res.status(400).json({
        success: false
      });
    } else {
      try {
        if (
          findExists(req.user.role, LEVELS.test) &&
          (req.body.parentid === undefined ||
            !mongooseModels.obj_id.isValid(req.body.parentid))
        ) {
          // this type does not get added to a parent line, so it is parentless and gets
          // added to the Lines collection which hasn't had
          let new_line = new mongooseModels.linesWithoutParents({
            loc: {
              type: "LineString",
              coordinates: req.body.line
            },
            restrs: [],
            restrs_length: 0
          });
          for (var restr of req.body.restrictions) {
            if (checkRestr(restr)) {
              restr_checked = {
                tp: restr.type,
                an: restr.angle,
                st: restr.start,
                ds: restr.days,
                wk: restr.weeks,
                mn: restr.months,
                lt: restr.limit,
                ed: restr.end,
                pm: restr.permit,
                ct: restr.cost,
                pr: restr.per,
                ve: restr.vehicle,
                sd: restr.side,
                up: 0,
                dn: 0,
                by: req.user.id,
                ud: new Date()
              };
              new_line.restrs.push(restr_checked);
              const line_id = new_line._id.toString();
              const restr_id = new_line.restrs[new_line.restrs.length - 1];
              let user_restrictions = db.curbmap_user_restrictions.findOne({
                where: { userid: req.user.id }
              });
              if (user_restrictions == null) {
                user_restrictions = db.curbmap_user_restrictions.build({
                  userid: req.user.id,
                  restrictions: []
                });
              }

              await user_restr.save();
            }
          }
          if (new_line.restrs.length > 0) {
            await new_line.save();
            res.status(200).json({
              success: true,
              line_id: new_line._id.toString()
            });
          } else {
            res.status(200).json({
              success: false
            });
          }
        } else if (findExists(req.user.role, LEVELS.test)) {
          let parent_id = mongooseModels.obj_id(req.body.parentid);

          let parent = await mongooseModels.parents
            .findOne({
              _id: parent_id
            })
            .exec();
          if (parent !== null) {
            parent.lines.push({
              loc: {
                type: "LineString",
                coordinates: req.body.line
              },
              restrs_length: 0,
              restrs: []
            });
            parent.lines_length += 1;
            let new_length = parent.lines_length;
            let checked_restrs = [];
            for (let restr of req.body.restrictions) {
              if (checkRestr(restr)) {
                restr_checked = {
                  tp: restr.type,
                  an: restr.angle,
                  st: restr.start,
                  ed: restr.end,
                  ds: restr.days,
                  wk: restr.weeks,
                  mn: restr.months,
                  lt: restr.limit,
                  pm: restr.permit,
                  ct: restr.cost,
                  pr: restr.per,
                  ve: restr.vehicle,
                  sd: restr.side,
                  up: 0,
                  dn: 0,
                  by: req.user.id,
                  ud: new Date()
                };
                parent.lines[new_length - 1].restrs.push(restr_checked);
                parent.lines[new_length - 1].restrs_length += 1;
                let length = parent.lines[new_length - 1].restrs.length;
                let restr_id =
                  parent.lines[new_length - 1].restrs[length - 1]._id;
                let line_id = parent.lines[new_length - 1]._id;
                let user_restrictions = db.curbmap_user_restriction.findOne({
                  where: { userid: req.user.id }
                });
                if (user_restrictions == null) {
                  user_restrictions = db.curbmap_user_restriction.build({
                    userid: req.user.id,
                    restrictions: []
                  });
                }
                user_restrictions.restrictions.push({
                  line_id,
                  restr_id,
                  date: new Date()
                });
                await user_restrictions.save();
                parent.total_types += 1;
                new_parent_types = parent.types_each;
                new_parent_types[restr["type"]] += 1;
                parent.types_each = new_parent_types; // to mark as modified
                parent.markModified("types_each");
              }
            }
            // Went through all new restrictions... now test if any were correct and added
            if (parent.lines[new_length - 1].restrs.length > 0) {
              // If the new line has some restrictions, add it, otherwise, don't
              await parent.save();
              res.status(200).json({
                success: true,
                line_id: parent.lines[new_length - 1]._id.toString()
              });
            } else {
              // we didn't add any new restrictions to the new line, so don't save it to the
              // parent line
              res.status(200).json({
                success: false
              });
            }
          }
        } else {
          return res.status(200).json({
            success: 200,
            comment:
              "If you were a user or on the app you could add lines! Come join us."
          });
        }
      } catch (error) {
        winston.log("warn", error);
      }
    }
  }
);

router.post(
  "/restriction",
  passport.authenticate("jwt", { session: false }),
  async function(req, res, next) {
    if (
      findExists(req.user.role, LEVELS.test) &&
      req.body.lineid !== undefined &&
      mongooseModels.obj_id.isValid(req.body.lineid)
    ) {
      // Whether the line has a parent or not, we must be able to find the line that
      // the restriction is being added to. Otherwise, we do not add the restriction
      let line_id = mongooseModels.obj_id(req.body.lineid);
      if (
        req.body.parentid === undefined ||
        !mongooseModels.obj_id.isValid(req.body.parentid)
      ) {
        // Adding a restriction to a line without a parent
        try {
          let lines_without_parent = await mongooseModels.linesWithoutParents
            .aggregate([
              {
                $match: {
                  _id: line_id
                }
              }
            ])
            .exec();
          if (lines_without_parent >= 1) {
            let line = lines_without_parent[0];
            let save = false;
            for (restr in req.body.restrictions) {
              if (checkRestr(restr)) {
                let temp_r = {
                  tp: restr["type"],
                  an: restr["angle"] ? restr["angle"] : 0,
                  st: restr["start"],
                  ed: restr["end"],
                  ds: restr["days"],
                  wk: restr["weeks"],
                  mn: restr["months"],
                  lt: restr["limit"] ? restr["limit"] : null,
                  pm: restr["permit"] ? restr["permit"] : null,
                  ct: restr["cost"] ? restr["cost"] : null,
                  pr: restr["per"] ? restr["per"] : null,
                  ve: restr["vehicle"] ? true : false,
                  up: 0,
                  dn: 0,
                  by: req.user.id
                };
                line.restrs.push(temp_r);
                let restr_id = line.restrs[line.restrs.length - 1]._id;
                let user_restrictions = db.curbmap_user_restriction.findOne({
                  where: { userid: req.user.id }
                });
                if (user_restrictions == null) {
                  db.curbmap_user_restriction.build({
                    userid: req.user.id,
                    restrictions: []
                  });
                }
                db.curbmap_user_restriction.restrictions.push({
                  line_id,
                  restr_id,
                  date: new Date()
                });
                await user_restrictions.save();
              }
            }
            await line.save();
            res.status(200).json({
              success: true
            });
          }
        } catch (err) {
          // couldn't find parent or something went wrong with search
          res.status(400).json({
            success: false
          });
        }
      } else {
        // Add a restriction to a line with a parent
        try {
          temp_subdocs = {};
          let parent_id = mongooseModels.obj_id(req.body.parentid);
          let the_line_parent = await mongooseModels.parents
            .findOne({
              _id: parent_id
            })
            .exec();
          if (the_line_parent !== null) {
            // we found the parent line, now find the sub-line segment
            let location = -1;
            for (let i = 0; i < length; i++) {
              if (line._id === line_id) {
                location = i;
                break;
              }
            }
            if (location !== -1) {
              for (restr in req.body.restrictions) {
                if (checkRestr(restr)) {
                  let temp_r = {
                    tp: restr["type"],
                    an: restr["angle"] ? restr["angle"] : 0,
                    st: restr["start"],
                    ed: restr["end"],
                    ds: restr["days"],
                    wk: restr["weeks"],
                    mn: restr["months"],
                    lt: restr["limit"] ? restr["limit"] : null,
                    pm: restr["permit"] ? restr["permit"] : null,
                    ct: restr["cost"] ? restr["cost"] : null,
                    pr: restr["per"] ? restr["per"] : null,
                    ve: restr["vehicle"] ? true : false,
                    up: 0,
                    dn: 0,
                    by: req.user.id
                  };
                  the_line_parent.lines[location].restrs.push(temp_r);
                  let length = the_line_parent.lines[location].restrs.length;
                  let restr_id =
                    the_line_parent.lines[location].restrs[length - 1]._id;
                  let line_id = the_line_parent.lines[location]._id;
                  let user_restrictions = db.curbmap_user_restriction.findOne({
                    where: { userid: req.user.id }
                  });
                  if (user_restrictions == null) {
                    user_restrictions = db.curbmap_user_restriction.build({
                      userid: req.user.id,
                      restrictions: []
                    });
                  }
                  user_restrictions.restrictions.push({
                    restr_id,
                    line_id,
                    date: new Date()
                  });
                  await user_restrictions.save();
                  the_line_parent.lines[location].markModified("restrs");
                  the_line_parent.lines[location].restrs_length += 1;
                  the_line_parent.lines[location].markModified("restrs_length");
                  the_line_parent.total_types += 1;
                  the_line_parent.markModified("total_types");
                  the_line_parent.types_each[restr["type"]] += 1;
                  the_line_parent.markModified("types_each");
                }
              }
              // once we have added all the data to the old parent object, resave it
              await the_line_parent.save();
            }
          }
        } catch (error) {
          // Something happened in the query
          res.status(400).json({
            success: false
          });
        }
      }
    } else {
      // have to have a line within the parent or on its own to add to. Otherwise, we
      // don't know what line to add to
      if (req.user.role === "ROLE_SANDBOX") {
        return res.status(200).json({
          success: true,
          comment:
            "We love that you're interested in helping out, but we need you to be in the app or logged in as a user."
        });
      } else {
        res.status(400).json({
          success: false
        });
      }
    }
  }
);
module.exports = router;
