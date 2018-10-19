const EndpointManager = require("./lib/endpointManager");
const SETTINGS = require("./config/settings.json");
const endpointManager = new EndpointManager(SETTINGS.endpoints);
const proxy = require("./lib/proxy")(endpointManager);

proxy.listen(SETTINGS.port, () => console.log(`listening on port ${SETTINGS.port}!`));
