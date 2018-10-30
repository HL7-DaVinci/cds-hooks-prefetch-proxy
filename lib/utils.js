module.exports.fhirBundleToMap = function(bundle) {
  const bundleMap = {};
  for (let entry of bundle.entry) {
    if (!entry.resource || !entry.resource.resourceType) continue;
    (bundleMap[entry.resource.resourceType] = bundleMap[entry.resource.resourceType] || []).push(
      entry.resource
    );
  }
  return bundleMap;
};

module.exports.readyHeadersForForwarding = function(headers, source_ip) {
  // 'headers' is from node, its an object with keys as header names, values are the associated vals
  // note that all headers have already been made lowercase by node

  const headers_to_remove = [
    // below are 'hop-by-hop' headers and are not supposed to be forwarded by a proxy
    // see https://tools.ietf.org/html/draft-ietf-httpbis-p1-messaging-14#section-7.1.3
    "connection",
    "keep-alive",
    "proxy-authenticate",
    "proxy-authorization",
    "te",
    "trailer",
    "transfer-encoding",
    "upgrade",
    // below are other headers to remove (this is not a non-transforming proxy)
    "content-length",
    "content-md5",
    "content-type",
    "host"
  ];
  // all headers referred to by the connection header should also be removed
  if (headers["connection"]) {
    headers_to_remove.push(...headers["connection"].split(",").map(s => s.trim().toLowerCase()));
  }

  const cloned_headers = Object.assign({}, headers);
  // add/modify the forwarded header
  if (cloned_headers["forwarded"]) {
    cloned_headers["forwarded"] += ", for=" + source_ip;
  } else {
    cloned_headers["forwarded"] = "for=" + source_ip;
  }
  // remove headers we don't forward
  for (const header_name of headers_to_remove) {
    delete cloned_headers[header_name];
  }

  return cloned_headers;
};
