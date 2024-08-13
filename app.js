import { Hono } from "hono";
import fs from "node:fs";
import { reason } from "./llm.js";

const app = new Hono();

app.get("/chat", async function (ctx) {
	const inquiry = ctx.req.query("q");
	console.log("Waiting for LLM...");
	const response = await reason(`Question: ${inquiry}`);
	console.log("LLM answers:", response);
	return ctx.text(response);
});
app.get("/", async function (ctx) {
	return ctx.html(fs.readFileSync("index.html"));
});

export default app;