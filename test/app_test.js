const request = require("supertest");
const assert = require("assert");
const setup_vcr = require("../test_helpers/setup_vcr");
const fs = require("fs");

const EndpointManager = require("../lib/endpointManager");
const SETTINGS = require("../config/settings.json");
const proxyMaker = require("../lib/proxy");
const hydratePrefetchQuery = require("../lib/hydratePrefetchQuery");

function getNewProxy() {
  return proxyMaker(new EndpointManager(SETTINGS.endpoints));
}

playbackOnly = true;
setup_vcr(playbackOnly, "http://localhost:8090", "http://localhost:8080");

const fixturePath = __dirname + "/../test_helpers/fixtures/";
const loadFixture = filename => JSON.parse(fs.readFileSync(fixturePath + filename));

describe("hydrate prefetch", function() {
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
  it("respond with 404", function(done) {
    request(getNewProxy())
      .get("/bad_endpoint/cds-services")
      .set("Accept", "application/json")
      .expect(404, done);
  });
});

describe("POST /dme_crd_r4/cds-services/bad_service", function() {
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
  it("respond with a 400", function(done) {
    request(getNewProxy())
      .post("/dme_crd_r4/cds-services/order-review-crd")
      .set("Content-Type", "application/json")
      .set("Accept", "application/json")
      .send("abc")
      .expect(400, done);
  });
});

describe("GET /dme_crd_stu3/cds-services when authorization required but not provided", function() {
  it("respond with 403", function(done) {
    request(getNewProxy())
      .get("/dme_crd_stu3/cds-services")
      .set("Accept", "application/json")
      .expect(403, done);
  });
});
