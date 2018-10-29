module.exports = function(hook, body) {
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
};
