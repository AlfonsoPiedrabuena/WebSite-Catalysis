import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  claveIdempotencia, construirPayload, enviarLead, limpiarTelefono, olvidarEnvio, validarLead, MENSAJES,
} from "../js/lib/lead-form.mjs";
import { buscarSector, SECTORES } from "../js/data/sectores.mjs";

const valido = { nombre: "Laura", apellido: "Mendoza", correo: "laura@empresa.com", tel: "55 1234 5678", empresa: "Acme", sector: "Banca", nivel: "Nivel 2", priv: true };

describe("validarLead", () => {
  it("datos completos → sin errores", () => {
    expect(validarLead(valido, { apellido: true, tel: "requerido", sector: true, nivel: true }, buscarSector)).toEqual({});
  });

  it("nombre, correo, empresa y privacidad siempre son obligatorios", () => {
    const e = validarLead({ nombre: " ", correo: "x", empresa: "", priv: false });
    expect(Object.keys(e).sort()).toEqual(["correo", "empresa", "nombre", "priv"]);
  });

  it("teléfono: requerido en Contacto, opcional en el flotante", () => {
    expect(validarLead({ ...valido, tel: "" }, { tel: "requerido" }).tel).toBe(MENSAJES.telRequerido);
    expect(validarLead({ ...valido, tel: "" }, { tel: "opcional" }).tel).toBeUndefined();
    expect(validarLead({ ...valido, tel: "abc" }, { tel: "opcional" }).tel).toBe(MENSAJES.telOpcional);
  });

  it("sector debe estar en la lista compartida", () => {
    expect(validarLead({ ...valido, sector: "Logist" }, { sector: true }, buscarSector).sector).toBe(MENSAJES.sector);
    expect(validarLead({ ...valido, sector: "banca" }, { sector: true }, buscarSector).sector).toBeUndefined();
  });

  it("respeta los límites de longitud del formulario anterior", () => {
    expect(validarLead({ ...valido, empresa: "x".repeat(51) }).empresa).toBe(MENSAJES.max(50));
    expect(validarLead({ ...valido, nombre: "x".repeat(101) }).nombre).toBe(MENSAJES.max(100));
  });
});

describe("limpiarTelefono y lista de sectores", () => {
  it("solo deja números, espacios, + y -", () => {
    expect(limpiarTelefono("+52 (55) 1234-5678 ext.9")).toBe("+52 55 1234-5678 9");
  });

  it("la lista compartida no trae entradas espurias y no repite etiquetas", () => {
    const etiquetas = SECTORES.map((s) => s.etiqueta);
    expect(etiquetas).toHaveLength(148);
    expect(new Set(etiquetas).size).toBe(etiquetas.length);
    expect(etiquetas.some((e) => /^Nivel \d$/.test(e))).toBe(false);
  });
});

describe("construirPayload", () => {
  it("arma el cuerpo de lead-register con el canal y los consentimientos", () => {
    const p = construirPayload({ ...valido, wa: true }, { canal: "sitio-flotante" });
    expect(p).toMatchObject({
      firstname: "Laura", lastname: "Mendoza", email: "laura@empresa.com", phone: "55 1234 5678", company: "Acme",
      industry: "Banca", nivel_de_madurez: "Nivel 2", acepto_recibir_mensajes_de_whatsapp: true, acuerdodeprivacidad: true,
      fuente: { canal: "sitio-flotante" },
    });
  });

  it("incluye evaluación e interés solo cuando existen", () => {
    expect(construirPayload(valido, { canal: "evaluacion" })).not.toHaveProperty("evaluacion");
    const p = construirPayload(valido, { canal: "agente", interes: " CRM ", evaluacion: { respuestas: [1, 1, 1, 1, 1, 1] } });
    expect(p.interes).toBe("CRM");
    expect(p.evaluacion.respuestas).toHaveLength(6);
  });

  it("el consentimiento de WhatsApp no viene premarcado", () => {
    expect(construirPayload(valido, { canal: "x" }).acepto_recibir_mensajes_de_whatsapp).toBe(false);
  });
});

describe("enviarLead", () => {
  const payload = construirPayload(valido, { canal: "sitio-contacto" });
  const resp = (status: number, body: unknown = {}) => ({ ok: status >= 200 && status < 300, status, json: async () => body }) as Response;
  beforeEach(() => olvidarEnvio());

  it("sin token de Turnstile no llama al servidor", async () => {
    const f = vi.fn();
    const r = await enviarLead(payload, null, f);
    expect(r).toMatchObject({ ok: false, tipo: "turnstile" });
    expect(f).not.toHaveBeenCalled();
  });

  it("201 → éxito y manda token e idempotencyKey", async () => {
    const f = vi.fn().mockResolvedValue(resp(201, { success: true }));
    expect(await enviarLead(payload, "tok", f)).toEqual({ ok: true });
    const body = JSON.parse(f.mock.calls[0][1].body);
    expect(body.turnstileToken).toBe("tok");
    expect(body.idempotencyKey).toMatch(/^[0-9a-f-]{36}$/);
    expect(f.mock.calls[0][0]).toBe("/.netlify/functions/lead-register");
  });

  it("502 y errores de red nunca son éxito", async () => {
    expect(await enviarLead(payload, "t", vi.fn().mockResolvedValue(resp(502, { error: "No pudimos" })))).toMatchObject({ ok: false, tipo: "servidor" });
    expect(await enviarLead(payload, "t", vi.fn().mockRejectedValue(new Error("offline")))).toMatchObject({ ok: false, tipo: "red" });
  });

  it("403 → turnstile, 400 → validación", async () => {
    expect(await enviarLead(payload, "t", vi.fn().mockResolvedValue(resp(403)))).toMatchObject({ tipo: "turnstile" });
    expect(await enviarLead(payload, "t", vi.fn().mockResolvedValue(resp(400, { error: "Faltan campos" })))).toMatchObject({ tipo: "validacion", mensaje: "Faltan campos" });
  });

  it("la clave de idempotencia se reutiliza en el reintento y cambia si cambian los datos", () => {
    const a = claveIdempotencia(payload);
    expect(claveIdempotencia(payload)).toBe(a);
    expect(claveIdempotencia({ ...payload, company: "Otra" })).not.toBe(a);
  });
});
