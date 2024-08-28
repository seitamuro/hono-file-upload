import { S3Client } from "@aws-sdk/client-s3";
import { HonoS3Storage } from "@hono-storage/s3";
import { Hono } from "hono";
import { handle } from "hono/aws-lambda";

const app = new Hono();

const client = new S3Client({ region: "us-east-1" });

const BUCKET_NAME = process.env.BUCKET_NAME;
if (!BUCKET_NAME) {
  throw new Error("BUCKET_NAME is required");
}

const storage = new HonoS3Storage({
  key: (_, file) => `${file.originalname}-${Date.now()}.${file.extension}`,
  bucket: BUCKET_NAME,
  client: client,
});

app.get("/", (c) => {
  return c.html(`
      <html>
        <body>
          <form
            action="/upload"
            method="post"
            enctype="multipart/form-data"
          >
            <input type="file" name="file" />
            <input type="submit" value="Upload" />
          </form>
        </body>
      </html>
      `);
});

app.post("/upload", storage.single("file"), async (c) => {
  const { file } = c.var.files;
  if (file) {
    return c.json({ message: "File uploaded successfully", file });
  }
  return c.json({ message: "Failed to upload the file" }, 400);
});

export const handler = handle(app);
