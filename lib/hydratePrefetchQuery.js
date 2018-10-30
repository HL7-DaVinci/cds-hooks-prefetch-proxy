const axios = require("axios");
const utils = require("./utils");
const logger = require("./logger");

//get data available for the prefetch template for the given hook
function getPTD(hook, body) {
  if (hook == "order-review") {
    return {
      user: body.user,
      context: {
        patientId: body.context.patientId,
        encounterId: body.context.encounterId,
        orders: utils.fhirBundleToMap(body.context.orders)
      }
    };
  }
  if (hook == "medication-prescribe") {
    return {
      user: body.user,
      context: {
        patientId: body.context.patientId,
        encounterId: body.context.encounterId,
        medications: utils.fhirBundleToMap(body.context.medications)
      }
    };
  }
}

function getHandlebarTokens(str) {
  const regex = /{{(.*?)}}/g;
  const matches = [];
  let match;
  while ((match = regex.exec(str)) !== null) {
    matches.push(match[1]);
  }
  return matches;
}

function processPrefetchQueryTemplate(prefetchQueryTemplate, ptd, prefetchKey) {
  const tokens = getHandlebarTokens(prefetchQueryTemplate);
  for (let token of tokens) {
    const resolvedToken = resolvePrefetchToken(token, ptd);
    if (!resolvedToken) {
      logger.log(
        "debug",
        `Prefetch key '${prefetchKey}': could not resolve '${token}', will not attempt to hydrate.`
      );
      return false;
    }
    prefetchQueryTemplate = prefetchQueryTemplate.replace("{{" + token + "}}", resolvedToken);
  }
  return prefetchQueryTemplate;
}

function resolvePrefetchToken(prefetchToken, ptd) {
  const elementList = [];
  const pathList = prefetchToken.split(".");
  resolvePrefetchTokenRecursive(ptd, pathList, elementList);
  return elementList.join(",");
}

//modifies elementList in place
function resolvePrefetchTokenRecursive(o, pathList, elementList) {
  if (o == null) {
    return;
  }
  if (pathList.length == 0) {
    elementList.push(o.toString());
    return;
  }

  o = o[pathList[0]];
  if (o == null) {
    return;
  }
  if (Array.isArray(o)) {
    for (let item of o) {
      resolvePrefetchTokenRecursive(item, pathList.slice(1), elementList);
    }
    return;
  }
  resolvePrefetchTokenRecursive(o, pathList.slice(1), elementList);
}

module.exports = async function hydratePrefetch(req_body, service_info) {
  req_body.prefetch = req_body.prefetch != null ? req_body.prefetch : {};
  const ptd = getPTD(service_info.hook, req_body);

  const neededItems = [];
  for (let prefetchKey in service_info.prefetch) {
    if (req_body.prefetch[prefetchKey] != null) {
      `Prefetch key '${prefetchKey}': already hydrated in the request.`;
      continue;
    }
    let prefetchQueryTemplate = service_info.prefetch[prefetchKey];
    let prefetchQuery = processPrefetchQueryTemplate(prefetchQueryTemplate, ptd, prefetchKey);
    if (prefetchQuery == false) continue;
    neededItems.push({ key: prefetchKey, query: prefetchQuery });
  }

  if (neededItems.length == 0) return; //no hydration needed
  //TODO: throw error if fhirserver not set!

  const conn = axios.create({ baseURL: req_body.fhirServer });
  if (req_body.oauth) conn.defaults.headers.common["Authorization"] = "Bearer " + req_body.oauth;

  try {
    const responses = await axios.all(neededItems.map(o => conn.get(o.query)));
    for (let i = 0; i < responses.length; i++) {
      const [prefetchKey, response] = [neededItems[i].key, responses[i]];
      if (response.data == null || response.data.total < 1) continue; //TODO: throw error
      logger.log("debug", `Prefetch key '${prefetchKey}': SUCCESSFULLY hydrated.`);
      req_body.prefetch[prefetchKey] = response.data;
    }
  } catch (error) {
    logger.log("debug", "Error executing fhir query: " + error.toString());
    logger.log("debug", "Unable to hydrate keys: " + neededItems.map(o => o.key).join(", "));
  }
};
