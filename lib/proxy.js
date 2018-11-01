const express = require("express");
const axios = require("axios");
var cors = require("cors");
const hydratePrefetchQuery = require("./hydratePrefetchQuery");
const logger = require("./logger");

// functions to forward responses from the endpoint
function passAlongError(res, message_parent) {
  return error => {
    logger.log("info", "ERROR: ", error.toString());
    let body = (error.response || {}).data != null ? error.response.data : error.toString();
    if (typeof body === "string") body = { message: body };
    if (message_parent != null) body = { message: message_parent, encountered_error: body };
    const status = (error.response || {}).status || 500;
    logger.log("debug", "Sending error (status " + status + "): ", body);
    res.status(status).send(body);
  };
}

function passAlongData(res) {
  return response => {
    logger.log("debug", "Sending response: ", response.data);
    res.send(response.data);
  };
}

// send common error messages
const SEND_ENDPOINT_NOT_EXIST = res =>
  res.status(404).send("This endpoint is not registered, set it up in the settings.");
const SEND_SERVICE_NOT_EXIST = res =>
  res.status(404).send("This service is not recognized for this endpoint.");

module.exports = function(endpointManager) {
  const proxy = express();
  proxy.use(cors());
  proxy.use(express.json());

  // setup proxy routes
  proxy.get("/:endpoint_id/cds-services", async function(req, res) {
    logger.log("debug", "Handling GET to /" + req.params.endpoint_id + "/cds-services");
    const endpointSettings = endpointManager.getEndpointSettings(req.params.endpoint_id);
    if (!endpointSettings) return SEND_ENDPOINT_NOT_EXIST(res);

    const headers = endpointManager.getForwardingHeaders(req.params.endpoint_id, req);
    try {
      const services = await endpointManager.getEndpointServices(
        req.params.endpoint_id,
        headers,
        false
      );
      logger.log("debug", "Sending:", services);
      res.send(services);
    } catch (error) {
      return passAlongError(res)(error);
    }
  });

  proxy.post("/:endpoint_id/cds-services/:service_id", async function(req, res) {
    logger.log(
      "debug",
      "Handling POST to /" + req.params.endpoint_id + "/cds-services/" + req.params.service_id
    );
    if (!req.body || !req.body.context) {
      return res.status(400).send("Bad request. Must be json and contain a context object.");
    }
    const endpointSettings = endpointManager.getEndpointSettings(req.params.endpoint_id);
    if (!endpointSettings) return SEND_ENDPOINT_NOT_EXIST(res);

    const headers = endpointManager.getForwardingHeaders(req.params.endpoint_id, req);
    let services;
    try {
      services = await endpointManager.getEndpointServices(req.params.endpoint_id, headers, true);
    } catch (error) {
      return passAlongError(res, "Unable to fetch cds-services information.")(error);
    }
    const service_info = services[req.params.service_id];
    if (!service_info) {
      return SEND_SERVICE_NOT_EXIST(res);
    }

    hydratePrefetchQuery(req.body, service_info).then(function() {
      axios
        .post(endpointSettings.url + "cds-services/" + req.params.service_id, req.body, {
          headers: headers
        })
        .then(passAlongData(res))
        .catch(passAlongError(res));
    });
  });

  return proxy;
};
