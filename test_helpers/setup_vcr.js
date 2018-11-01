const http = require("http");
const express = require("express");
const yakbak = require("yakbak");

const YAK_PORT = 44659; // if this is changed, for some reason everything needs to be re-recorded

module.exports = function(name, noRecord, ...servers_to_yak) {
  // use yakbak to replace the servers with proxies that record and playback http requests
  const server_to_idx = {};
  const yaks = [];
  servers_to_yak.forEach(function(server, i) {
    yaks.push(yakbak(server, { dirname: __dirname + "/tapes/" + name, noRecord: noRecord }));
    server_to_idx[server] = i;
  });

  const vcr_server = express()
    .use(function(req, res) {
      const id = req.path.substring(1, req.path.indexOf("/", 1));
      req.url = req.url.substr(1 + id.length);
      yaks[parseInt(id)](req, res);
    })
    .listen(YAK_PORT);

  // capture requests and override, will not work if passed in url, only options
  // this has ONLY been tested to work with use of http.request by axios
  const http_request = http.request;
  http.request = function(options, callback) {
    const url = options.protocol + "//" + options.hostname + ":" + options.port;
    if (url in server_to_idx) {
      const idx = server_to_idx[url];
      [options.protocol, options.hostname, options.port] = ["http:", "localhost", YAK_PORT];
      options.host = "localhost:" + YAK_PORT;
      options.path = "/" + idx + options.path;
    }
    return http_request(options, callback);
  };

  return {
    stop: function() {
      vcr_server.close();
      http.request = http_request; // undo monkey patch of http.request
    }
  };
};
