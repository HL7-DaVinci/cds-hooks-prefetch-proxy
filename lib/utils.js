module.exports.fhirBundleToMap = function fhirBundleToMap(bundle) {
  const bundleMap = {};
  for (let entry of bundle.entry) {
    if (!entry.resource || !entry.resource.resourceType) continue;
    (bundleMap[entry.resource.resourceType] = bundleMap[entry.resource.resourceType] || []).push(
      entry.resource
    );
  }
  return bundleMap;
};
