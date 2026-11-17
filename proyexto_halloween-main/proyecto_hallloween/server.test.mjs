import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { after, before, test } from "node:test";
import { createAppServer } from "./server.mjs";

let temporaryDirectory;
let dataFile;
let server;
let baseUrl;

before(async () => {
  temporaryDirectory = await mkdtemp(path.join(os.tmpdir(), "nochecita-test-"));
  dataFile = path.join(temporaryDirectory, "suggestions.json");
  await writeFile(dataFile, "[]\n");
  server = createAppServer({ dataFile });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  await rm(temporaryDirectory, { recursive: true, force: true });
});

test("sirve la aplicación y una lista de sugerencias vacía", async () => {
  const page = await fetch(baseUrl);
  assert.equal(page.status, 200);
  assert.match(page.headers.get("content-type"), /text\/html/);
  assert.match(await page.text(), /Nochecita/);

  const response = await fetch(`${baseUrl}/api/suggestions`);
  assert.equal(response.status, 200);
  assert.deepEqual((await response.json()).suggestions, []);
});

test("valida los datos obligatorios antes de guardar", async () => {
  const response = await fetch(`${baseUrl}/api/suggestions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: "Plan sin información" }),
  });
  assert.equal(response.status, 400);
  const result = await response.json();
  assert.ok(result.details.length > 0);
  assert.deepEqual(JSON.parse(await readFile(dataFile, "utf8")), []);
});

test("guarda sugerencias y las entrega en la siguiente consulta", async () => {
  const input = {
    title: "Cine en el parque",
    locality: "Usaquén",
    category: "aire-libre",
    audience: "familia",
    date: "2026-10-31",
    time: "18:30",
    place: "Parque de muestra",
    price: 0,
    description: "Proyección de película al aire libre.",
    sourceUrl: "https://example.com/plan",
  };
  const created = await fetch(`${baseUrl}/api/suggestions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  assert.equal(created.status, 201);
  const { suggestion } = await created.json();
  assert.equal(suggestion.status, "pending");
  assert.equal(suggestion.title, input.title);
  assert.equal(suggestion.sourceUrl, input.sourceUrl);

  const listed = await fetch(`${baseUrl}/api/suggestions`);
  assert.equal((await listed.json()).suggestions[0].id, suggestion.id);
  assert.equal(JSON.parse(await readFile(dataFile, "utf8"))[0].title, input.title);
});

test("rechaza fechas imposibles", async () => {
  const response = await fetch(`${baseUrl}/api/suggestions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: "Fecha inválida",
      locality: "Usaquén",
      category: "cultura",
      audience: "familia",
      date: "2026-02-31",
      time: "18:30",
      place: "Parque",
      price: 0,
      description: "Prueba de fecha.",
      sourceUrl: "https://example.com/plan",
    }),
  });
  assert.equal(response.status, 400);
  assert.match((await response.json()).details.join(" "), /fecha/i);
});
