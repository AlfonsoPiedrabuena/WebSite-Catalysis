import { createRequire } from "node:module";
import { generateKeyPairSync } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import { estadoInicial, reducir, INTERESES } from "../js/lib/asistente.mjs";
import { DATO_DE_REGISTRO, enmascarar, enviarHistorial, prepararHistorial, resultadoDe } from "../js/lib/chat-log.mjs";

const require = createRequire(import.meta.url);
const srv = require("../netlify/functions/chat-log.js").__test;

type Ev = Parameters<typeof reducir>[1];
const correr = (acts: Ev[], desde = estadoInicial("CAT-ABCD-2345")) => acts.reduce((s, a) => reducir(s, a), desde);
const registro: Ev[] = [
  { tipo: "iniciar" }, { tipo: "texto", valor: "Laura Mendoza" }, { tipo: "texto", valor: "laura@empresa.com" },
  { tipo: "texto", valor: "Acme" }, { tipo: "elegir", valor: INTERESES[0] },
  { tipo: "alternar_consentimiento", valor: "priv" }, { tipo: "aceptar_consentimiento" }, { tipo: "confirmar" }, { tipo: "guardado" },
];

describe("enmascarar", () => {
  const casos: [string, string][] = [
    ["escríbeme a laura@empresa.com por favor", "escríbeme a [correo] por favor"],
    ["mi cel es 55 1234 5678", "mi cel es [teléfono]"],
    ["+52 (55) 3933-7086", "[teléfono]"],
    ["tengo 12 empleados y 3 sucursales", "tengo 12 empleados y 3 sucursales"],
    ["migrar a la nube", "migrar a la nube"],
  ];
  it.each(casos)("%s", (entrada, salida) => {
    expect(enmascarar(entrada)).toBe(salida);
    expect(srv.enmascarar(entrada)).toBe(salida); // la Function repite el enmascarado: deben coincidir
  });
});

describe("prepararHistorial", () => {
  it("no hay historial mientras el visitante no haya hecho nada", () => {
    expect(prepararHistorial(estadoInicial("CAT-ABCD-2345"))).toBeNull();
    expect(prepararHistorial(estadoInicial())).toBeNull();
  });

  it("el registro no deja nombre, correo, empresa ni teléfono en el historial", () => {
    const h = prepararHistorial(correr(registro), { inicio: "2026-10-27T10:00:00Z", pagina: "/index.html" })!;
    const todo = JSON.stringify(h);
    for (const dato of ["Laura", "laura@empresa.com", "Acme"]) expect(todo).not.toContain(dato);
    expect(h.mensajes.filter((m) => m.texto === DATO_DE_REGISTRO).length).toBeGreaterThanOrEqual(5);
    expect(h.resultado).toBe("registro");
    expect(h.flujos).toEqual(["datos"]);
    expect(h.clave).toBe("CAT-ABCD-2345");
  });

  it("enmascara correos y teléfonos escritos en una duda", () => {
    const h = prepararHistorial(correr([{ tipo: "texto", valor: "automatizar, escribe a ana@x.com o al 5512345678" }]))!;
    expect(h.mensajes.find((m) => m.rol === "usuario")!.texto).toBe("automatizar, escribe a [correo] o al [teléfono]");
  });

  it("resultado según el último flujo", () => {
    expect(resultadoDe(correr([{ tipo: "elegir_flujo", valor: "agendar" }]))).toBe("agenda");
    expect(resultadoDe(correr([{ tipo: "elegir_flujo", valor: "persona" }]))).toBe("whatsapp");
    expect(resultadoDe(correr([{ tipo: "elegir_flujo", valor: "checklist" }]))).toBe("checklist");
    expect(resultadoDe(correr([{ tipo: "texto", valor: "nube" }]))).toBe("dudas");
    expect(resultadoDe(correr([{ tipo: "iniciar" }]))).toBe("sin_resultado");
  });
});

describe("enviarHistorial", () => {
  const h = prepararHistorial(correr([{ tipo: "elegir_flujo", valor: "agendar" }]))!;
  const ok = (cuerpo = {}) => vi.fn().mockResolvedValue({ ok: true, json: async () => cuerpo });

  it("sin token ni sello no envía nada", async () => {
    const f = ok();
    expect(await enviarHistorial(h, {}, f)).toEqual({ ok: false });
    expect(f).not.toHaveBeenCalled();
  });

  it("primer envío con token; devuelve el sello, que usa en los siguientes (sin token)", async () => {
    const f = ok({ sello: "s".repeat(64) });
    const r = await enviarHistorial(h, { turnstileToken: "tok" }, f);
    expect(r).toEqual({ ok: true, sello: "s".repeat(64) });
    expect(JSON.parse(f.mock.calls[0][1].body)).toMatchObject({ turnstileToken: "tok" });
    await enviarHistorial(h, { sello: "s".repeat(64) }, f);
    const cuerpo2 = JSON.parse(f.mock.calls[1][1].body);
    expect(cuerpo2.sello).toBe("s".repeat(64));
    expect(cuerpo2.turnstileToken).toBeUndefined();
  });

  it("nunca lanza: red caída o respuesta de error → ok:false", async () => {
    expect(await enviarHistorial(h, { turnstileToken: "t" }, vi.fn().mockRejectedValue(new Error("red")))).toEqual({ ok: false });
    expect(await enviarHistorial(h, { turnstileToken: "t" }, vi.fn().mockResolvedValue({ ok: false }))).toEqual({ ok: false });
  });
});

describe("Function chat-log", () => {
  const { privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
  const env = {
    TURNSTILE_SECRET_KEY: "secreto-de-prueba", FIREBASE_CLIENT_EMAIL: "svc@proyecto-x.iam.gserviceaccount.com",
    FIREBASE_PRIVATE_KEY: privateKey.export({ type: "pkcs8", format: "pem" }).toString().replace(/\n/g, "\\n"),
  };
  const cuerpo = (extra = {}) => ({
    clave: "CAT-ABCD-2345", inicio: new Date().toISOString(), pagina: "/index.html", flujos: ["agendar", "otro"], resultado: "agenda",
    mensajes: [{ rol: "bot", texto: "Hola" }, { rol: "usuario", texto: "mi correo es a@b.com" }, { rol: "root", texto: "x" }],
    fuente: { utmSource: "meta", hack: "x" }, ...extra,
  });
  const evento = (body: unknown, headers: Record<string, string> = { origin: "https://catalysis.com.mx" }) => ({ httpMethod: "POST", headers, body: JSON.stringify(body) });
  const montar = (turnstileOk = true, firestoreOk = true) => {
    const llamadas: { url: string; init: any }[] = [];
    const f = vi.fn(async (url: string, init: any) => {
      llamadas.push({ url, init });
      if (url.includes("siteverify")) return { ok: true, json: async () => ({ success: turnstileOk }) };
      if (url.includes("oauth2")) return { ok: true, json: async () => ({ access_token: "at", expires_in: 3600 }) };
      return { ok: firestoreOk, json: async () => ({}) };
    });
    return { f, llamadas, handler: srv.crearHandler(f, env) };
  };

  it("primer envío: verifica Turnstile, escribe en Firestore con la clave como id y devuelve el sello", async () => {
    const { handler, llamadas } = montar();
    const r = await handler(evento(cuerpo({ turnstileToken: "tok" })));
    expect(r.statusCode).toBe(200);
    const sello = JSON.parse(r.body).sello;
    expect(srv.selloValido("CAT-ABCD-2345", sello, env.TURNSTILE_SECRET_KEY)).toBe(true);
    const fs = llamadas.find((l) => l.url.includes("firestore.googleapis.com"))!;
    expect(fs.url).toContain("/projects/catalysis-blog/databases/(default)/documents/asistente_conversaciones/CAT-ABCD-2345");
    expect(fs.init.method).toBe("PATCH");
    expect(fs.init.headers.Authorization).toBe("Bearer at");
    const campos = JSON.parse(fs.init.body).fields;
    expect(campos.mensajes.arrayValue.values).toHaveLength(2); // descarta el rol inválido
    expect(JSON.stringify(campos)).not.toContain("a@b.com");
    expect(JSON.stringify(campos)).toContain("[correo]");
    expect(campos.flujos.arrayValue.values).toHaveLength(1);
    expect(Object.keys(campos.fuente.mapValue.fields)).toEqual(["utmSource"]);
    expect(campos.expira.timestampValue).toBeTruthy();
  });

  it("envíos siguientes con el sello no vuelven a llamar a Turnstile", async () => {
    const { handler, llamadas } = montar();
    const sello = srv.sellar("CAT-ABCD-2345", env.TURNSTILE_SECRET_KEY);
    const r = await handler(evento(cuerpo({ sello })));
    expect(r.statusCode).toBe(200);
    expect(llamadas.some((l) => l.url.includes("siteverify"))).toBe(false);
  });

  it("rechaza sin verificación, con sello de otra clave, con Turnstile fallido y con origen ajeno", async () => {
    expect((await montar().handler(evento(cuerpo()))).statusCode).toBe(403);
    const selloAjeno = srv.sellar("CAT-ZZZZ-9999", env.TURNSTILE_SECRET_KEY);
    expect((await montar().handler(evento(cuerpo({ sello: selloAjeno })))).statusCode).toBe(403);
    expect((await montar(false).handler(evento(cuerpo({ turnstileToken: "malo" })))).statusCode).toBe(403);
    expect((await montar().handler(evento(cuerpo({ turnstileToken: "t" }), { origin: "https://malo.example" }))).statusCode).toBe(403);
  });

  it("valida método, clave, tamaño y configuración", async () => {
    const { handler } = montar();
    expect((await handler({ httpMethod: "GET", headers: {} })).statusCode).toBe(405);
    expect((await handler(evento(cuerpo({ clave: "../otro" })))).statusCode).toBe(400);
    expect((await handler({ ...evento(cuerpo()), body: "x".repeat(70000) })).statusCode).toBe(413);
    expect((await handler(evento(cuerpo({ turnstileToken: "t", mensajes: [] })))).statusCode).toBe(400);
    expect((await srv.crearHandler(vi.fn(), { ...env, FIREBASE_PRIVATE_KEY: "" })(evento(cuerpo()))).statusCode).toBe(500);
  });

  it("si Firestore falla responde 502 y no entrega sello", async () => {
    const r = await montar(true, false).handler(evento(cuerpo({ turnstileToken: "tok" })));
    expect(r.statusCode).toBe(502);
    expect(r.body).not.toContain("sello");
  });

  it("sanitizar: acota la fecha de inicio y calcula expira a 5 meses", () => {
    const ahora = new Date("2026-10-27T12:00:00Z");
    const ok = srv.sanitizar(cuerpo({ inicio: "2026-10-27T10:00:00Z" }), ahora);
    expect(ok.expira.toISOString().slice(0, 10)).toBe("2027-03-27");
    const viejo = srv.sanitizar(cuerpo({ inicio: "2020-01-01T00:00:00Z" }), ahora);
    expect(viejo.inicio).toEqual(ahora);
    expect(srv.sanitizar(cuerpo({ resultado: "inventado", pagina: "http://x" }), ahora)).toMatchObject({ resultado: "sin_resultado", pagina: "" });
  });
});
