const { createProxyMiddleware } = require("http-proxy-middleware");

function filter(pathname, req) {
  return (
    pathname.startsWith("/transfer-to-ladok/api") ||
    pathname.startsWith("/transfer-to-ladok/auth") ||
    req.method !== "GET"
  );
}

module.exports = function (app) {
  app.use(
    createProxyMiddleware(filter, {
      target: "http://localhost:3000/",
    })
  );
};
