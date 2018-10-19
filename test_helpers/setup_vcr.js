const http = require("http");
const express = require("express");
const yakbak = require("yakbak");

module.exports = function(noRecord, ...servers_to_yak) {
  // use yakbak to replace the servers with proxies that record and playback http requests
  const server_to_id = {};
  const id_to_yak = {};
  servers_to_yak.forEach(function(server, i) {
    const id = i.toString().padStart(5, "0");
    yak = yakbak(server, { dirname: __dirname + "/tapes", noRecord: noRecord });
    [server_to_id[server], id_to_yak[id]] = [id, yak];
    console.log("yakking " + server);
  });

  express()
    .use(function(req, res) {
      yak = id_to_yak[req.path.substr(1, 5)];
      req.url = req.url.substr(6);
      yak(req, res);
    })
    .listen(44659);

  // capture requests and override, will not work if passed in url, only options
  // this has ONLY been tested to work with use of http.request by axios
  const http_request = http.request;
  http.request = function(options, callback) {
    const url = options.protocol + "//" + options.hostname + ":" + options.port;
    if (url in server_to_id) {
      const id = server_to_id[url];
      [options.protocol, options.hostname, options.port] = ["http:", "localhost", 44659];
      options.host = "localhost:44658";
      options.path = "/" + id + options.path;
    }
    return http_request(options, callback);
  };
};
