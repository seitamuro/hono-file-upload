import { Hono } from "hono";
import { handle } from "hono/aws-lambda";

const app = new Hono();

app.post("/upload", async (c) => {
  const parseBody = await c.req.parseBody();
  console.log(parseBody);
  const formData = await c.req.formData();
  console.log(formData);
});

export const handler = handle(app);
