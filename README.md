# CDS Hooks Prefetch Proxy

The CDS Hooks Prefetch Proxy is a small proxy that can sit in between the CDS Services server, and an EHR (or other client issuing cds hook requests). If the prefetch has not been filled in by the EHR, the proxy will attempt to fill it by executing the FHIR queries against the EHR, and sending the filled in request to the CDS Service provider. This means that potentially neither the EHR or the CDS Service provider need to support filling in the prefetch. The proxy could also be used if an EHR has a FHIR server not accessible by the CDS Services server that is needed to fill in the prefetch. In this case the proxy could be run inside the EHR servers firewall.

The proxy supports the [draft addition](https://github.com/cds-hooks/docs/issues/377) to the CDS Hook specification that allows access to objects in the context for use in a prefetch token.



## Configuration

To use the proxy, endpoints must first be set up in the configuration file `config/settings.json`. NOTE this means that the proxy will not forward requests to any destination, only ones that have been set up. Here is an example settings file:
```json
{
  "port": 32100,
  "endpoints": {
    "example_service_r4": {
      "url": "http://exampleservice.com:8080/r4/",
      "services_cache_time": 120,
      "forward_headers": true
    },
    "a_different_service": {
      "url": "http://differentservice.com/cds_service1/",
      "services_cache_time": 0,
      "forward_headers": false
    }
  }
}
```
In the above example, if a request were sent to the proxy such as `GET http://localhost:32100/example_service_r4/cds-services`, the proxy will execute a `GET http://exampleservice.com:8080/r4/cds-services` and pass along the response.
#### Settings file - options:
- **`port`** (required): Choose the port which the proxy will run on.
- **`endpoints`** (required): An object whose keys will be used as the url path representing the endpoint, and whose value should be an options object.

##### Endpoint options object - options:
- **`url`** (required):  The base url of the cds service you would like to proxy.
- **`services_cache_time`** (optional, default = 3600):  Specify how long to cache the service discovery results (i.e. the response from `/cds-services`), in seconds. The cache is not used if a client requests the service discovery directly, but will be used internally when determining how to fill a prefetch when handling a call to a CDS Service. Set this to 0 to disable it (which means that the proxy will query the service discovery endpoint every time it handles a call to a service).
- **`forward_headers`** (optional, default = true): Unless this is disabled (set to false), headers from the request will be used by the proxy when sending requests to the endpoint. This can be used, for example, if authorization headers are required.

## Installation and Running
The proxy is written in `javascript` and can be run with `node`. It is tested against node version 10.10 (but is likely to work with slightly older versions and any newer versions). It has been set up with `yarn`, but should work with `npm`.

To install, navigate to the root of the project directory and run
`yarn install`
After setting up some endpoints (see configuration), you can now start the server with
`yarn start`
The tests can similarly be run with `yarn test`, and linting with `yarn lint`

## Usage
Once the proxy is running and the endpoints have been set up, you can now point your cds service requests to the proxy instead of the real service endpoint. For example, say you are using a cds service with the following base url `http://www.healthITcompanyX.com/cds/`. You would add it to `settings.json` like 
```json
{
  "port": 32100,
  "endpoints": {
    "health_it_company_x": {
      "url": "http://www.healthITcompanyX.com/cds/",
      "services_cache_time": 3600,
      "forward_headers": true
    }...
  }
}
```
Now, for service discovery, instead of pointing your client to `http://www.healthITcompanyX.com/cds/cds-services`, you can point it to `http://localhost:32100/health_it_company_x/cds-services`. Similarly, a POST request to `http://www.healthITcompanyX.com/cds/cds-services/service1` can now be sent to `http://localhost:32100/health_it_company_x/cds-services/service1`.
