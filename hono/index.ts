import { Hono } from 'hono';

const app = new Hono();

app.get('/', c => c.text('Hello, World!'));

export default defineEventHandler(event => {
  event.node.req.originalUrl = '';
  const webReq = toWebRequest(event);
  return app.fetch(webReq);
});
