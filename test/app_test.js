/* eslint-env mocha */

const request = require("supertest");
const assert = require("assert");
const setup_vcr = require("../test_helpers/setup_vcr");
const fs = require("fs");

const EndpointManager = require("../lib/endpointManager");
const proxyMaker = require("../lib/proxy");
const hydratePrefetchQuery = require("../lib/hydratePrefetchQuery");

const vcrPlaybackOnly = false; //if true, no new web requests are made (new ones get 404)

const SETTINGS = {
  endpoints: {
    dme_crd_r4: {
      url: "http://localhost:8090/r4/",
      services_cache_time: 0,
      forward_headers: false
    },
    dme_crd_stu3: {
      url: "http://localhost:8090/stu3/",
      services_cache_time: 0,
      forward_headers: false
    }
  }
};

function getNewProxy(custom_settings) {
  if (!custom_settings) custom_settings = SETTINGS;
  return proxyMaker(new EndpointManager(custom_settings.endpoints));
}
let global_vcr;
const use_vcr = name =>
  (global_vcr = setup_vcr(name, vcrPlaybackOnly, "http://localhost:8090", "http://localhost:8080"));
const stop_vcr = () => global_vcr.stop();

const fixturePath = __dirname + "/../test_helpers/fixtures/";
const loadFixture = filename => JSON.parse(fs.readFileSync(fixturePath + filename));

describe("hydrate prefetch", function() {
  before(function() {
    use_vcr("a");
  });
  after(function() {
    stop_vcr();
  });
  it("respond with cds-services json", function(done) {
    const req = loadFixture("request1_needsPrefetch.json");
    const svcs = loadFixture("dme_crd_r4_cds-services.json");
    assert.strictEqual(req.prefetch, undefined);
    hydratePrefetchQuery(req, svcs["order-review-crd"]).then(function() {
      assert.strictEqual(req.prefetch.deviceRequestBundle.resourceType, "Bundle");
      done();
    });
  });
});

describe("GET /dme_crd_r4/cds-services", function() {
  before(function() {
    use_vcr("b");
  });
  after(function() {
    stop_vcr();
  });
  it("respond with cds-services json", function(done) {
    request(getNewProxy())
      .get("/dme_crd_r4/cds-services")
      .set("Accept", "application/json")
      .expect("Content-Type", /json/)
      .expect(200)
      .then(response => {
        assert.strictEqual(response.body["order-review-crd"].hook, "order-review");
        done();
      });
  });
});

describe("POST /dme_crd_r4/cds-services/order-review-crd", function() {
  before(function() {
    use_vcr("c");
  });
  after(function() {
    stop_vcr();
  });
  it("respond with a message indicating a rule is required", function(done) {
    const req = loadFixture("request1_needsPrefetch.json");
    const res = loadFixture("request1_response.json");
    request(getNewProxy())
      .post("/dme_crd_r4/cds-services/order-review-crd")
      .send(req)
      .set("Accept", "application/json")
      .expect("Content-Type", /json/)
      .expect(200)
      .then(response => {
        assert.deepStrictEqual(response.body, res);
        done();
      });
  });
});

describe("GET /bad_endpoint/cds-services", function() {
  before(function() {
    use_vcr("d");
  });
  after(function() {
    stop_vcr();
  });
  it("respond with 404", function(done) {
    request(getNewProxy())
      .get("/bad_endpoint/cds-services")
      .set("Accept", "application/json")
      .expect(404, done);
  });
});

describe("POST /dme_crd_r4/cds-services/bad_service", function() {
  before(function() {
    use_vcr("e");
  });
  after(function() {
    stop_vcr();
  });
  it("respond with 404", function(done) {
    const req = loadFixture("request1_needsPrefetch.json");
    request(getNewProxy())
      .post("/dme_crd_r4/cds-services/bad_service")
      .send(req)
      .set("Accept", "application/json")
      .expect(404, done);
  });
});

describe("POST /dme_crd_r4/cds-services/order-review-crd with bad JSON", function() {
  before(function() {
    use_vcr("f");
  });
  after(function() {
    stop_vcr();
  });
  it("respond with a 400", function(done) {
    request(getNewProxy())
      .post("/dme_crd_r4/cds-services/order-review-crd")
      .set("Content-Type", "application/json")
      .set("Accept", "application/json")
      .send("abc")
      .expect(400, done);
  });
});

describe("GET /dme_crd_stu3/cds-services when authorization required", function() {
  before(function() {
    use_vcr("g");
  });
  after(function() {
    stop_vcr();
  });
  const settings = {
    endpoints: {
      dme_crd_stu3: {
        url: "http://localhost:8090/stu3/",
        forward_headers: false
      }
    }
  };
  const auth_token =
    "Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IkNJUDhFOVVoSW53TDFFT0xGTDRTTW5rb3ZyWHFzcGttZVV5SFpzMElzZjgiLCJqa3UiOiJodHRwOi8vbG9jYWxob3N0OjMwMDEvcHVibGljX2tleXMifQ.eyJpc3MiOiJsb2NhbGhvc3Q6MzAwMCIsImF1ZCI6InI0L29yZGVyLXJldmlldy1zZXJ2aWNlcyIsImlhdCI6MTU0MDg0MTAxNCwiZXhwIjoxNTQwOTI3NDE0LCJqdGkiOiJIaXNVdzFyay1iQi1aUW9ESEhkeWVicXJNIn0.ER_jgeZYKmDigvhd6rlS8cpdof04YAUXjFqBD1PuU2WqT2BEIktCmg1yQuwrSnFFLYX-qaWuoks3--b10h_Lqgmgwg4YMv4poYfQdaZZ7wJPXlRTI0aN61B6anMHo3NjWacvjbUVhngWshMl89w37nrQMjvkmSHc0KphkVDlZr5ihTVdpWhJgl0KqjhfLTNDAXSQUNt6OesVwgQs9drGog7DBeyqJJ7JD9D0nIDExttUQKOT6QoALnLIL4K9ZRAxr13Ds3rhm02GxVflgV5Eq_MYspNbJ4Dr325VfXean2ZKc91QjIruzY76XdHgixHZNSl-ZlOYOI8yHD0pu7JiSA";

  it("respond with 403 if no authorization is forwarded", function(done) {
    settings.endpoints.dme_crd_stu3.forward_headers = false;
    request(getNewProxy(settings))
      .get("/dme_crd_stu3/cds-services")
      .set("Accept", "application/json")
      .set("authorization", auth_token)
      .expect(403, done);
  });
  it("respond with 200 if authorization is forwarded (all headers forwarded)", function(done) {
    settings.endpoints.dme_crd_stu3.forward_headers = true;
    request(getNewProxy(settings))
      .get("/dme_crd_stu3/cds-services")
      .set("authorization", auth_token)
      .expect(200, done);
  });
});

describe("GET /dme_crd_r4/cds-services when endpoint is not available", function() {
  it("respond with 50X", function(done) {
    const settings = {
      endpoints: {
        dme_crd_r4: {
          url: "http://localhost:9999/r4/" // bad port
        }
      }
    };
    request(getNewProxy(settings))
      .get("/dme_crd_r4/cds-services")
      .set("Accept", "application/json")
      .then(response => {
        assert(response.status.toString().startsWith("50"));
        done();
      });
  });
});
