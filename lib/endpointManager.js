const axios = require("axios");

module.exports = class EndpointManager {
  constructor(endpoints) {
    this.endpoints = endpoints;
  }

  loadEndpointServices(endpoint_id) {
    let endpoint = this.endpoints[endpoint_id];
    axios
      .get(endpoint.url + "cds-services/")
      .then(response => {
        endpoint.services = {};
        for (let service of response.data.services) {
          endpoint.services[service.id] = service;
        }
        console.log("Loaded service information for " + endpoint_id);
      })
      .catch(error => {
        console.log(
          "Error fetching the services information for " + endpoint_id + ": " + error.toString()
        );
      });
  }

  loadAllServices() {
    for (let endpoint_id in this.endpoints) {
      this.loadEndpointServices(endpoint_id);
    }
  }

  getEndpoint(endpoint_id) {
    return this.endpoints[endpoint_id];
  }
};
