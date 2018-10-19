var path = require("path");

/**
 * POST /r4/cds-services/order-review-crd
 *
 * accept: application/json, text/plain, * / *
 * content-type: application/json;charset=utf-8
 * user-agent: axios/0.19.0-beta.1
 * content-length: 3471
 * host: localhost:8090
 * connection: close
 */

module.exports = function (req, res) {
  res.statusCode = 200;

  res.setHeader("x-content-type-options", "nosniff");
  res.setHeader("x-xss-protection", "1; mode=block");
  res.setHeader("cache-control", "no-cache, no-store, max-age=0, must-revalidate");
  res.setHeader("pragma", "no-cache");
  res.setHeader("expires", "0");
  res.setHeader("x-frame-options", "DENY");
  res.setHeader("content-type", "application/json;charset=UTF-8");
  res.setHeader("transfer-encoding", "chunked");
  res.setHeader("date", "Fri, 19 Oct 2018 20:29:21 GMT");
  res.setHeader("connection", "close");

  res.setHeader("x-yakbak-tape", path.basename(__filename, ".js"));

  res.write(new Buffer("eyJjYXJkcyI6W3sic3VtbWFyeSI6IkRvY3VtZW50YXRpb24gaXMgcmVxdWlyZWQgZm9yIHRoZSBkZXNpcmVkIGRldmljZSBvciBzZXJ2aWNlIiwiZGV0YWlsIjoiVGhlcmUgYXJlIGRvY3VtZW50YXRpb24gcmVxdWlyZW1lbnRzIGZvciB0aGUgZm9sbG93aW5nIGNyaXRlcmlhOlxuIFBhdGllbnQgaXMgb2YgZ2VuZGVyOiAnQW55JyBhbmQgYmV0d2VlbiB0aGUgYWdlcyBvZjogMTggYW5kIDgwIGFuZCBsaXZlcyBpbiBzdGF0ZTogJ0FueSdcbiBEZXZpY2Ugb3Igc2VydmljZSBoYXMgY29kZSBvZiAnOTQ2NjAnXG4gU2VydmljZSBpcyByZXF1ZXN0ZWQgaW4gc3RhdGU6ICdBbnknLiIsImluZGljYXRvciI6ImluZm8iLCJzb3VyY2UiOnsibGFiZWwiOiJEYSBWaW5jaSBDUkQgUmVmZXJlbmNlIEltcGxlbWVudGF0aW9uIiwidXJsIjpudWxsfSwic3VnZ2VzdGlvbnMiOm51bGwsImxpbmtzIjpbeyJsYWJlbCI6IkRvY3VtZW50YXRpb24gUmVxdWlyZW1lbnRzIiwidXJsIjoiaHR0cHM6Ly93d3cuY21zLmdvdi9PdXRyZWFjaC1hbmQtRWR1Y2F0aW9uL01lZGljYXJlLUxlYXJuaW5nLU5ldHdvcmstTUxOL01MTlByb2R1Y3RzL2Rvd25sb2Fkcy9QQVBfRG9jQ3ZnX0ZhY3RzaGVldF9JQ045MDUwNjQucGRmIiwidHlwZSI6ImFic29sdXRlIiwiYXBwQ29udGV4dCI6bnVsbH1dfV19", "base64"));
  res.end();

  return __filename;
};
