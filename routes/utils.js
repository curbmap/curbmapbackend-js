const isNull = require("util").isNull;

const findExists = (needle, haystack) => {
  return haystack.indexOf(needle) >= 0;
};

const constructBoxesFrom = boxes => {
  let newBoxes = [];
  for (box of boxes) {
    newBoxes.push({
      origin_x: box.x,
      origin_y: box.y,
      width: box.width,
      height: box.height,
      categories: [box.type.key]
    });
  }
  return newBoxes;
};

const checkRestr = restr => {
  return (
    restr.type !== undefined &&
    checkDurationForType(restr.type, restr.duration) &&
    checkPermitForType(restr.type, restr.permit) &&
    checkCostForType(restr.type, restr.cost, restr.per) &&
    restr.side !== undefined &&
    restr.angle !== undefined &&
    typeof restr.days === "object" &&
    restr.days.length === 7 &&
    typeof restr.weeks === "object" &&
    restr.weeks.length === 4 &&
    typeof restr.months === "object" &&
    restr.months.length === 12 &&
    restr.start !== undefined &&
    restr.start >= 0 &&
    restr.start <= 1440 &&
    restr.end >= 0 &&
    restr.end <= 1440
  );
};

const checkDurationForType = (type, duration) => {
  if (type == 0 || type == 1) {
    // Short term parking < 1hour (green or metered green)
    return !isNull(duration) && duration < 60;
  } else if (type == 2 || type == 3) {
    // Timed parking >= 1hour (metered or time limited)
    return !isNull(duration) && duration >= 60;
  } else if (type == 4) {
    // Time limit with permit... duration must be defined and a valid value
    return !isNull(duration) && duration > 0 && duration <= 1440;
  } else if (!isNull(duration)) {
    // Some other type that has a defined duration allowed but must be valid I've
    // never seen more than 10 hour parking, but if there is like
    return duration > 0 && duration <= 1440;
  }
  // Otherwise an undefined or null duration is fine
  return true;
};
var checkPermitForType = (type, permit) => {
  if (type == 4) {
    return !isNull(permit) && permit !== "";
  }
  return true;
};

const checkCostForType = (type, cost, per) => {
  if (type == 1 || type == 3 || type == 5) {
    return !isNull(cost) && cost > 0 && per > 0;
  }
  return true;
};

/*
   * @param results, JSON from mongo
   * @param points, boolean whether to include lines (sufficiently small enough OLC/polygon size/or just user's points)
   * @returns {Array}
   */
const processResults = (results, getLines) => {
  let returnResults = [];
  for (let result in results) {
    let newResponse = {};
    newResponse["coordinates"] = results[result].loc.coordinates;
    newResponse["key"] = results[result]._id.toString();
    newResponse["lines"] = [];
    if (getLines) {
      for (let line of results[result].lines) {
        if (line.restrs_length > 0) {
          let newLine = {
            key: line._id.toString(),
            restrs: []
          };
          newLine["coords"] = line.loc.coordinates;
          line.restrs.forEach((restr, idx) => {
            newLine.restrs.push({
              id: restr._id.toString(),
              tp: restr["tp"],
              an: restr["an"],
              st: restr["st"],
              ed: restr["ed"],
              ds: restr["ds"],
              wk: restr["wk"],
              mn: restr["mn"],
              ct: restr["ct"],
              pr: restr["pr"],
              ve: restr["ve"],
              up: restr["up"],
              dn: restr["dn"]
            });
          });
          newResponse["lines"].push(newLine);
        }
      }
    } else {
      // don't get lines
    }
    newResponse["total_types"] = results[result].total_types;
    newResponse["types_each"] = results[result].types_each;

    returnResults.push(newResponse);
  }
  return returnResults;
};

module.exports = {
  processResults,
  checkCostForType,
  checkDurationForType,
  checkPermitForType,
  checkRestr,
  constructBoxesFrom,
  findExists
};
