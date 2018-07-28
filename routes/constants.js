const LEVELS = {
  sandbox: [
    "ROLE_SANDBOX",
    "ROLE_TEST",
    "ROLE_USER",
    "ROLE_ADMIN",
    "ROLE_OWNER"
  ],
  test: ["ROLE_TEST", "ROLE_USER", "ROLE_ADMIN", "ROLE_OWNER"],
  user: ["ROLE_USER", "ROLE_ADMIN", "ROLE_OWNER"],
  admin: ["ROLE_ADMIN", "ROLE_OWNER"],
  owner: ["ROLE_OWNER"]
};
const MAX_FILE_SIZE = 20 * 1000 * 1000;

const APN_OPTIONS = {
  token: {
    key: "../config/apn_cert.p8",
    keyId: "N36MRYQ382",
    teamId: "CNKFCAS44G"
  }
};

let host_res = "https://curbmap.com:50003/";
let host_auth = "https://curbmap.com/";
if (process.env.ENVIRONMENT === "TEST") {
  host_res = `${process.env.RES}/`;
  host_auth = `${process.env.AUTH}/`;
}

const HOST_RES = host_res;
const HOST_AUTH = host_auth;

const constants = {
    HOST_AUTH,
    HOST_RES,
    APN_OPTIONS,
    MAX_FILE_SIZE,
    LEVELS
}

module.exports = constants