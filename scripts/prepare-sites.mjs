import { copyFile, mkdir } from "node:fs/promises";

await mkdir("dist/.openai", { recursive: true });
await copyFile(".openai/hosting.json", "dist/.openai/hosting.json");
await copyFile("dist/server/prerendered-routes/index.html", "dist/client/index.html");
await copyFile("dist/server/prerendered-routes/404.html", "dist/client/404.html");
await copyFile("sites/worker.js", "dist/server/index.js");
