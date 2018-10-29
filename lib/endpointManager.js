const axios = require("axios");

module.exports = class EndpointManager {
  constructor(endpoints) {
    this.endpoints = endpoints;
    for (let endpoint of Object.values(this.endpoints)) {
      endpoint.services_last_updated = 0;
      if (endpoint.services_cache_time == null) endpoint.services_cache_time = 0;
      endpoint.services_cache_time *= 1000;
    }
  }

  getEndpointSettings(endpoint_id) {
    return this.endpoints[endpoint_id];
  }

  async loadEndpointServices(endpoint_id, headers) {
    let endpoint = this.endpoints[endpoint_id];
    try {
      const response = await axios.get(endpoint.url + "cds-services/", { headers: headers });
      endpoint.services_cache = {};
      for (let service of response.data.services) {
        endpoint.services_cache[service.id] = service;
      }
      console.log("Loaded service information for " + endpoint_id);
      endpoint.services_last_updated = Date.now();
      return endpoint.services_cache;
    } catch (error) {
      console.log(
        "Error fetching the services information for " + endpoint_id + ": " + error.toString()
      );
      throw error;
    }
  }

  /**
   *
   * @param {*} endpoint_id
   * @param {*} headers Optional. If provided, will be added to the services request.
   */
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
      const services = await this.loadEndpointServices(endpoint_id, headers);
      return services;
    } catch (error) {
      throw error;
    }
  }
};
