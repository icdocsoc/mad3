import app from "./app";

export default defineEventHandler((event) => {
  event.node.req.originalUrl = "";
  const webReq = toWebRequest(event);
  return app.fetch(webReq);
});
