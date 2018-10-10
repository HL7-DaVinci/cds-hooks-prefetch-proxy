const express = require("express");
const axios = require("axios");
const hydratePrefetchQuery = require("./lib/hydratePrefetchQuery");
const EndpointManager = require("./lib/endpointManager");
const SETTINGS = require("./config/settings.json");

const app = express();
app.use(express.json());
const endpointManager = new EndpointManager(SETTINGS.endpoints);
//fetch service information for each service
endpointManager.loadAllServices();
//reload service information every 12 hours
setInterval(() => endpointManager.loadAllServices(), 12 * 60 * 60 * 1000);

function passAlongError(res) {
  return error => {
    console.log(error.toString());
    const body = (error.response || {}).data != null ? error.response.data : error.toString();
    const status = (error.response || {}).status || 502;
    res.status(status).send(body);
  };
}

function passAlongData(res) {
  return response => {
    res.send(response.data);
  };
}

app.get("/:endpoint_id/cds-services", function(req, res) {
  const endpoint = endpointManager.getEndpoint(req.params.endpoint_id);
  if (!endpoint) {
    return res.status(404).send("This endpoint is not registered in the proxy.");
  }
  axios
    .get(endpoint.url + "cds-services/")
    .then(passAlongData(res))
    .catch(passAlongError(res));
});

app.post("/:endpoint_id/cds-services/:service_id", function(req, res) {
  if (!req.body || !req.body.context) {
    return res.status(400).send("Bad request. Must be json and contain a context object.");
  }
  const endpoint = endpointManager.getEndpoint(req.params.endpoint_id);
  if (!endpoint) {
    return res.status(404).send("This endpoint is not registered in the proxy.");
  }
  const service_info = endpoint.services[req.params.service_id];
  if (!service_info) {
    return res.status(404).send("This service if not recognized for this endpoint.");
  }

  hydratePrefetchQuery(req.body, service_info).then(function() {
    axios
      .post(endpoint.url + "cds-services/" + req.params.service_id, req.body)
      .then(passAlongData(res))
      .catch(passAlongError(res));
  });
});

app.listen(SETTINGS.port, () => console.log(`listening on port ${SETTINGS.port}!`));
