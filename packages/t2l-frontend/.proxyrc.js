const { createProxyMiddleware } = require("http-proxy-middleware");

function filter(pathname, req) {
  return pathname.match("^/transfer-to-ladok/api") || req.method !== "GET";
}

module.exports = function (app) {
  app.use(
    createProxyMiddleware(filter, {
      target: "http://localhost:3000/",
    })
  );
};
