const axios = require("axios");

module.exports = class EndpointManager {
  constructor(endpoints) {
    this.endpoints = endpoints;
    for (let endpoint of Object.values(this.endpoints)) {
      endpoint.services_last_updated = 0;
      if (endpoint.services_cache_time == null) endpoint.services_cache_time = 120;
      endpoint.services_cache_time *= 1000;
    }
  }

  endpointExists(endpoint_id) {
    return endpoint_id in this.endpoints;
  }

  async loadEndpointServices(endpoint_id) {
    let endpoint = this.endpoints[endpoint_id];
    try {
      const response = await axios.get(endpoint.url + "cds-services/");
      endpoint.services = {};
      for (let service of response.data.services) {
        endpoint.services[service.id] = service;
      }
      console.log("Loaded service information for " + endpoint_id);
      endpoint.services_last_updated = Date.now();
    } catch (error) {
      console.log(
        "Error fetching the services information for " + endpoint_id + ": " + error.toString()
      );
      throw error;
    }
  }

  async getEndpointWithServices(endpoint_id) {
    let endpoint = this.endpoints[endpoint_id];
    if (!endpoint) return null;
    //return with cached services if appropriate
    if (
      endpoint.services &&
      endpoint.services_cache_time != 0 &&
      endpoint.services_last_updated + endpoint.services_cache_time > Date.now()
    ) {
      return endpoint;
    }
    try {
      await this.loadEndpointServices(endpoint_id);
      return endpoint;
    } catch (error) {
      throw error;
    }
  }
};
