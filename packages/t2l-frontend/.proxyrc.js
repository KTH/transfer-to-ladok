const { createProxyMiddleware } = require("http-proxy-middleware");

function filter(pathname, req) {
  const g =
    pathname.startsWith("/transfer-to-ladok/api") ||
    pathname.startsWith("/transfer-to-ladok/auth") ||
    req.method !== "GET";
  console.log(req.method, pathname, g);
  return g;
}

module.exports = function (app) {
  app.use(
    createProxyMiddleware(filter, {
      xfwd: true,
      target: "http://localhost:3000/",
    })
  );
};
