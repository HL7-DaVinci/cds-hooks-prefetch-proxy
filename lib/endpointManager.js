const axios = require("axios");
const logger = require("./logger");
const utils = require("./utils");

module.exports = class EndpointManager {
  constructor(endpoints) {
    this.endpoints = endpoints;
    for (let endpoint of Object.values(this.endpoints)) {
      // set settings to default if not provided
      if (endpoint.services_cache_time == null) endpoint.services_cache_time = 3600;
      if (endpoint.forward_headers == null) endpoint.forward_headers = true;

      endpoint.services_last_updated = 0;
      endpoint.services_cache_time *= 1000; //convert seconds to milliseconds, for date comparisons
    }
  }

  getEndpointSettings(endpoint_id) {
    return this.endpoints[endpoint_id];
  }

  async _loadEndpointServices(endpoint_id, headers) {
    let endpoint = this.endpoints[endpoint_id];
    try {
      const response = await axios.get(endpoint.url + "cds-services/", { headers: headers });
      endpoint.services_cache = {};
      for (let service of response.data.services) {
        endpoint.services_cache[service.id] = service;
      }
      logger.log("info", "Loaded service information for " + endpoint_id);
      endpoint.services_last_updated = Date.now();
      return endpoint.services_cache;
    } catch (error) {
      logger.log(
        "info",
        "Error fetching the services information for " + endpoint_id + ": " + error.toString()
      );
      throw error;
    }
  }

  getForwardingHeaders(endpoint_id, req) {
    let endpoint = this.endpoints[endpoint_id];
    if (!endpoint) return null;

    const client_ip =
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      (req.connection.socket || {}).remoteAddress ||
      (req.info || {}).remoteAddress;

    if (endpoint.forward_headers === true) {
      return utils.readyHeadersForForwarding(req.headers, client_ip);
    } else {
      return utils.readyHeadersForForwarding({}, client_ip); // just add the forwarded header
    }
  }

  async getEndpointServices(endpoint_id, headers, try_cache) {
    let endpoint = this.endpoints[endpoint_id];
    if (!endpoint) return null;
    //return with cached services if appropriate
    if (
      try_cache &&
      endpoint.services_cache &&
      endpoint.services_cache_time != 0 &&
      endpoint.services_last_updated + endpoint.services_cache_time > Date.now()
    ) {
      return endpoint.services_cache;
    }
    try {
      const services = await this._loadEndpointServices(endpoint_id, headers);
      return services;
    } catch (error) {
      throw error;
    }
  }
};
