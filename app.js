const EndpointManager = require("./lib/endpointManager");
const SETTINGS = require("./config/settings.json");
const endpointManager = new EndpointManager(SETTINGS.endpoints);
const proxy = require("./lib/proxy")(endpointManager);
const logger = require("./lib/logger");

proxy.listen(SETTINGS.port, () => logger.log("info", `listening on port ${SETTINGS.port}!`));
