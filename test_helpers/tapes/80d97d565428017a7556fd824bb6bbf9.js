var path = require("path");

/**
 * GET /stu3/cds-services/
 *
 * user-agent: axios/0.19.0-beta.1
 * host: localhost:8090
 * connection: close
 */

module.exports = function (req, res) {
  res.statusCode = 403;

  res.setHeader("set-cookie", ["JSESSIONID=8D444454221906B7C81C892B4B672920; Path=/; HttpOnly"]);
  res.setHeader("x-content-type-options", "nosniff");
  res.setHeader("x-xss-protection", "1; mode=block");
  res.setHeader("cache-control", "no-cache, no-store, max-age=0, must-revalidate");
  res.setHeader("pragma", "no-cache");
  res.setHeader("expires", "0");
  res.setHeader("x-frame-options", "DENY");
  res.setHeader("content-type", "application/json;charset=UTF-8");
  res.setHeader("transfer-encoding", "chunked");
  res.setHeader("date", "Mon, 29 Oct 2018 12:22:51 GMT");
  res.setHeader("connection", "close");

  res.setHeader("x-yakbak-tape", path.basename(__filename, ".js"));

  res.write(new Buffer("eyJ0aW1lc3RhbXAiOiIyMDE4LTEwLTI5VDEyOjIyOjUxLjQ4MCswMDAwIiwic3RhdHVzIjo0MDMsImVycm9yIjoiRm9yYmlkZGVuIiwibWVzc2FnZSI6IkFjY2VzcyBEZW5pZWQiLCJwYXRoIjoiL3N0dTMvY2RzLXNlcnZpY2VzLyJ9", "base64"));
  res.end();

  return __filename;
};
