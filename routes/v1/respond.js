const express = require("express");
const router = express.Router();
const passport = require("passport");
const winston = require("winston");
const mongooseModels = require("../../model/mongooseModels.js");
const apn = require("apn"); // for apple notification
const twilio = require("twilio");
const { APN_OPTIONS } = require("../constants");

const twilclient = new twilio(process.env.TWILIOSID, process.env.TWILIOAUTH); // for twilio messaging
const onCallList = process.env.ONCALLLIST.split(",");
const MessagingResponse = require("twilio").twiml.MessagingResponse;
let apnProvider = new apn.Provider(APN_OPTIONS);

// should probably require this from twilio.com
router.post("/text", async function(req, res, next) {
  var ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
  let body = req.body.Body.split(" ");
  if (
    [2, 3, 4, 5].includes(body.length) &&
    mongooseModels.obj_id.isValid(body[0]) &&
    ["Y", "N"].includes(body[1])
  ) {
    // correct length and probably correct message
    try {
      let respText = await mongooseModels.photosText.findOne({
        _id: mongooseModels.obj_id(body[0])
      });
      if (respText.responses.length < 1) {
        let untilDate = new Date(
          body[3] + " " + body[2] + " " + respText.timezone
        );
        respText.responses.push({
          from: req.body.From,
          date: new Date(),
          canPark: body[1] === "Y",
          until: body[1] === "Y" ? untilDate : null,
          permit:
            body.length === 5 ? body[4] : body.length === 3 ? body[2] : null // if exists otherwise null
        });
        if (respText.device_type === true) {
          let notification = new apn.Notification();
          notification.expiry = Math.floor(Date.now() / 1000) + 24 * 3600;
          notification.badge = 2;
          if (body[1] === "Y") {
            notification.alert =
              "You can park at the spot you just uploaded a photo for, until: " +
              untilDate +
              " unless you have permit:" +
              body[4];
          } else {
            if (body.length === 3) {
              notification.alert =
                "You can only park there if you have permit: " + body[2];
            } else {
              notification.alert =
                "It's best if you do not park at the location you just photographed.";
            }
          }
          notification.topic = "com.curbmap.curbmap";
          notification.sound = "ping.aiff";
          notification.payload = { messageFrom: "curbmap" };
          let result = await apnProvider.send(notification, respText.token);
        } else {
          // send message to android
        }
        respText.save();
        var twilmsg = new MessagingResponse();
        twilmsg.message("success! Thanks for making curbmap better!");
        const tempJSON = {
          from: req.body.From,
          body: req.body.Body,
          time: new Date()
        };
        fs.appendFileSync("textmessages.json", JSON.stringify(tempJSON));
        res.writeHead(200, {
          "Content-Type": "text/xml"
        });
        res.end(twilmsg.toString());
      } else {
        // respond that there's already been a response stored
        var twilmsg = new MessagingResponse();
        twilmsg.message("Error response already received!");
        res.writeHead(200, {
          "Content-Type": "text/xml"
        });
        res.end(twilmsg.toString());
        return;
      }
    } catch (err) {
      var twilmsg = new MessagingResponse();
      twilmsg.message("Something went wrong trying to save the response!");
      res.writeHead(200, {
        "Content-Type": "text/xml"
      });
      res.end(twilmsg.toString());
      return;
    }
  } else {
    var twilmsg = new MessagingResponse();
    twilmsg.message("Error in content for your response!");
    res.writeHead(200, {
      "Content-Type": "text/xml"
    });
    res.end(twilmsg.toString());
  }
});

module.exports = router;
