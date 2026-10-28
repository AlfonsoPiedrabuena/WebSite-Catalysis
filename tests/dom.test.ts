// @vitest-environment jsdom
// Pruebas de humo con DOM (jsdom): ejecutan los scripts reales de cada página contra su HTML real,
// con fetch y Turnstile simulados. No sustituyen la revisión visual en navegador.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ROOT } from "../scripts/shell-lib.mjs";

const leer = (rel: string) => readFileSync(join(ROOT, rel), "utf8");
const body = (rel: string) => leer(rel).match(/<body[^>]*>([\s\S]*)<\/body>/)![1].replace(/<script[\s\S]*?<\/script>/g, "");
const tick = (ms = 0) => new Promise((r) => setTimeout(r, ms));
const $ = <T extends HTMLElement = HTMLElement>(sel: string) => document.querySelector(sel) as T;
const escribir = (sel: string, valor: string) => { const el = $<HTMLInputElement>(sel); el.value = valor; el.dispatchEvent(new Event("input", { bubbles: true })); el.dispatchEvent(new Event("change", { bubbles: true })); };
const marcar = (sel: string, on = true) => { const el = $<HTMLInputElement>(sel); el.checked = on; el.dispatchEvent(new Event("change", { bubbles: true })); };

const fetchMock = vi.fn();
const respuesta = (status: number, body: unknown = {}) => ({ ok: status < 300, status, json: async () => body, text: async () => "" }) as Response;

async function montar(rel: string, cargar?: () => Promise<unknown>) {
  vi.resetModules();
  document.documentElement.className = "js";
  document.body.innerHTML = body(rel);
  window.history.replaceState(null, "", "/" + rel);
  if (cargar) await cargar();
}

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  (window as any).turnstile = { render: (_el: unknown, o: any) => { o.callback("token-prueba"); return "w1"; }, reset: vi.fn(), remove: vi.fn() };
  const w = (window as any).turnstile; const widgets: Record<string, any> = {}; let n = 0;
  w.render = (_el: unknown, o: any) => { const id = `w${++n}`; widgets[id] = o; o.callback("token-prueba"); return id; };
  w.reset = vi.fn((id: string) => widgets[id] && widgets[id].callback("token-prueba"));
  (window as any).getFuente = (canal: string, leadMagnet?: string) => ({ canal, ...(leadMagnet ? { leadMagnet } : {}) });
  (window as any).catTrack = { event: vi.fn(), lead: vi.fn(), calendlyUrl: (u: string) => u };
  window.scrollTo = vi.fn() as any;
  Element.prototype.scrollIntoView = vi.fn();
  sessionStorage.clear();
});
afterEach(() => { vi.unstubAllGlobals(); document.body.innerHTML = ""; });

const llamadasA = (parte: string) => fetchMock.mock.calls.filter((c) => String(c[0]).includes(parte));
const cuerpoEnviado = () => JSON.parse(llamadasA("lead-register").at(-1)![1].body);

describe("contacto.html + js/contact.js", () => {
  it("muestra errores por campo y no envía si faltan datos", async () => {
    await montar("contacto.html", () => import("/js/contact.js"));
    $("#contactForm").dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    await tick();
    expect(fetchMock).not.toHaveBeenCalled();
    expect($("#form-banner").hidden).toBe(false);
    expect($("#nombre-e").hidden).toBe(false);
    expect($("#priv-e").textContent).toContain("aviso de privacidad");
    expect(document.activeElement?.id).toBe("nombre");
  });

  it("WhatsApp no viene premarcado", async () => {
    await montar("contacto.html", () => import("/js/contact.js"));
    expect($<HTMLInputElement>("#wa").checked).toBe(false);
  });

  it("envía el lead al canal sitio-contacto y muestra las gracias solo tras éxito", async () => {
    fetchMock.mockResolvedValue(respuesta(201, { success: true }));
    await montar("contacto.html", () => import("/js/contact.js"));
    escribir("#nombre", "Laura"); escribir("#apellido", "Mendoza"); escribir("#correo", "laura@empresa.com");
    escribir("#tel", "55 1234 5678"); escribir("#empresa", "Acme"); escribir("#sector", "banca"); escribir("#nivel", "Nivel 3");
    marcar("#priv");
    $("#contactForm").dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    await tick(10);
    const b = cuerpoEnviado();
    expect(b).toMatchObject({ firstname: "Laura", lastname: "Mendoza", email: "laura@empresa.com", company: "Acme", industry: "Banca", nivel_de_madurez: "Nivel 3", acuerdodeprivacidad: true, acepto_recibir_mensajes_de_whatsapp: false, turnstileToken: "token-prueba" });
    expect(b.fuente.canal).toBe("sitio-contacto");
    expect($("#contact-ok").hidden).toBe(false);
    expect($("#contactForm").hidden).toBe(true);
    expect((window as any).catTrack.lead).toHaveBeenCalledWith({ lead_source: "contact_page", nivel_madurez: "Nivel 3" });
  });

  it("si el CRM falla (502) no muestra éxito, conserva los datos y no dispara generate_lead", async () => {
    fetchMock.mockResolvedValue(respuesta(502, { error: "No pudimos registrar tu solicitud" }));
    await montar("contacto.html", () => import("/js/contact.js"));
    escribir("#nombre", "Laura"); escribir("#apellido", "Mendoza"); escribir("#correo", "laura@empresa.com");
    escribir("#tel", "5512345678"); escribir("#empresa", "Acme"); escribir("#sector", "Banca"); escribir("#nivel", "No lo sé");
    marcar("#priv");
    $("#contactForm").dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    await tick(10);
    expect($("#contact-ok").hidden).toBe(true);
    expect($("#form-banner").textContent).toContain("No pudimos enviar tu mensaje");
    expect($<HTMLInputElement>("#nombre").value).toBe("Laura");
    expect($("#enviar").textContent).toBe("Reintentar envío");
    expect((window as any).catTrack.lead).not.toHaveBeenCalled();
  });

  it("el combobox de sector filtra y elige", async () => {
    await montar("contacto.html", () => import("/js/contact.js"));
    escribir("#sector", "banc");
    expect($("#sector-list").hidden).toBe(false);
    const opciones = [...document.querySelectorAll("#sector-list [role=option]")].map((o) => o.textContent);
    expect(opciones).toContain("Banca");
    ($("#sector-list [role=option]") as HTMLElement).click();
    expect($<HTMLInputElement>("#sector").value).toBe(opciones[0]);
    expect($("#sector-list").hidden).toBe(true);
  });
});

describe("evaluacion.html + js/evaluacion.js", () => {
  async function responderTodo(resp: number[]) {
    $("[data-eval-start]").click();
    for (const r of resp) {
      ($("#q-opts").children[r - 1] as HTMLElement).click();
      $("#q-next").click();
    }
  }

  it("calcula el resultado y lo muestra (3,3,2,3,2,3 → Nivel 3, 2.7)", async () => {
    await montar("evaluacion.html", () => import("/js/evaluacion.js"));
    await responderTodo([3, 3, 2, 3, 2, 3]);
    expect($("[data-panel=result]").hidden).toBe(false);
    expect($("#r-title").textContent).toBe("Nivel 3: Intermedia");
    expect($("#r-eyebrow").textContent).toContain("2.7 DE 5");
    expect($("#r-dims").children).toHaveLength(6);
    expect((window as any).catTrack.event).toHaveBeenCalledWith("evaluacion_completa", expect.objectContaining({ nivel: 3 }));
  });

  it("no avanza sin responder y permite regresar", async () => {
    await montar("evaluacion.html", () => import("/js/evaluacion.js"));
    $("[data-eval-start]").click();
    expect($<HTMLButtonElement>("#q-next").disabled).toBe(true);
    ($("#q-opts").children[1] as HTMLElement).click();
    expect($<HTMLButtonElement>("#q-next").disabled).toBe(false);
    $("#q-next").click();
    expect($("#q-step").textContent).toBe("Pregunta 2 de 6");
    $("#q-back").click();
    expect($("#q-step").textContent).toBe("Pregunta 1 de 6");
    expect(($("#q-opts").children[1] as HTMLElement).getAttribute("aria-pressed")).toBe("true");
  });

  it("envía el lead con canal evaluacion y las seis respuestas (sin claves nuevas en el payload del CRM)", async () => {
    fetchMock.mockResolvedValue(respuesta(201));
    await montar("evaluacion.html", () => import("/js/evaluacion.js"));
    await responderTodo([4, 4, 4, 5, 5, 5]);
    escribir("#ev-nombre", "Laura"); escribir("#ev-correo", "laura@empresa.com"); escribir("#ev-empresa", "Acme"); escribir("#ev-sector", "Banca");
    marcar("#ev-priv");
    $("#eval-form").dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    await tick(10);
    const b = cuerpoEnviado();
    expect(b.fuente.canal).toBe("evaluacion");
    expect(b.evaluacion.respuestas).toEqual([4, 4, 4, 5, 5, 5]);
    expect(b.acepto_recibir_mensajes_de_whatsapp).toBe(false);
    expect($("#r-thanks").hidden).toBe(false);
    expect($("#r-thanks").textContent).toContain("te contactaremos");
    expect((window as any).catTrack.lead).toHaveBeenCalledWith({ lead_source: "maturity_assessment", nivel_madurez: "Nivel 5" });
  });

  it("error de envío: conserva el resultado y no muestra gracias", async () => {
    fetchMock.mockRejectedValue(new Error("offline"));
    await montar("evaluacion.html", () => import("/js/evaluacion.js"));
    await responderTodo([1, 1, 1, 1, 1, 1]);
    escribir("#ev-nombre", "Laura"); escribir("#ev-correo", "laura@empresa.com"); escribir("#ev-empresa", "Acme"); escribir("#ev-sector", "Banca");
    marcar("#ev-priv");
    $("#eval-form").dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    await tick(10);
    expect($("#r-thanks").hidden).toBe(true);
    expect($("#r-alert").hidden).toBe(false);
    expect($("#r-title").textContent).toBe("Nivel 1: Inicial");
  });

  it("repetir la evaluación vuelve a la introducción", async () => {
    await montar("evaluacion.html", () => import("/js/evaluacion.js"));
    await responderTodo([2, 2, 2, 2, 2, 2]);
    $("#ev-restart").click();
    expect($("[data-panel=intro]").hidden).toBe(false);
    expect($("[data-panel=result]").hidden).toBe(true);
  });
});

describe("marco-madurez.html + js/madurez.js", () => {
  it("las pestañas solo muestran u ocultan: los 5 niveles siguen en el DOM", async () => {
    await montar("marco-madurez.html", () => import("/js/madurez.js"));
    expect(document.querySelectorAll(".lvl")).toHaveLength(5);
    expect(document.querySelectorAll(".lvl.is-active")).toHaveLength(1);
    ($("[data-nivel='5'].tab") as HTMLElement).click();
    expect($("#nivel-5").classList.contains("is-active")).toBe(true);
    expect($("#nivel-3").classList.contains("is-active")).toBe(false);
    expect($("[data-nivel='5'].tab").getAttribute("aria-pressed")).toBe("true");
    expect(location.search).toBe("?nivel=5");
    expect((window as any).catTrack.event).toHaveBeenCalledWith("marco_nivel_ver", { nivel: 5 });
  });

  it("respeta ?nivel= de la URL", async () => {
    vi.resetModules();
    document.body.innerHTML = body("marco-madurez.html");
    window.history.replaceState(null, "", "/marco-madurez.html?nivel=2");
    await import("/js/madurez.js");
    expect($("#nivel-2").classList.contains("is-active")).toBe(true);
  });
});

describe("flotantes (js/flotantes.js)", () => {
  async function conFlotantes(rel = "index.html") {
    await montar(rel);
    return import("/js/flotantes.js");
  }

  it("monta los dos botones y el formulario corto abre como dialog con foco", async () => {
    await conFlotantes();
    const botones = [...document.querySelectorAll(".fbtn")].map((b) => b.textContent);
    expect(botones).toEqual(["Agenda tu diagnóstico", "Habla con el agente"]);
    ($(".fbtn--primary")).click();
    const dlg = $(".fp-form");
    expect(dlg.getAttribute("role")).toBe("dialog");
    expect($(".fbtn--primary").getAttribute("aria-expanded")).toBe("true");
    expect(document.activeElement?.id).toBe("fl-nombre");
  });

  it("Esc cierra el panel y devuelve el foco al botón", async () => {
    await conFlotantes();
    const btn = $(".fbtn--primary");
    btn.focus(); btn.click();
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    expect(document.querySelector(".fpanel")).toBeNull();
    expect(document.activeElement).toBe(btn);
    expect(btn.getAttribute("aria-expanded")).toBe("false");
  });

  it("los paneles son excluyentes", async () => {
    await conFlotantes();
    $(".fbtn--primary").click();
    $(".fbtn--dark").click();
    expect(document.querySelectorAll(".fpanel")).toHaveLength(1);
    expect($(".fpanel").classList.contains("fp-chat")).toBe(true);
  });

  it("formulario corto: valida, envía con canal sitio-flotante y confirma solo tras éxito", async () => {
    fetchMock.mockResolvedValue(respuesta(201));
    await conFlotantes();
    $(".fbtn--primary").click();
    $("#fl-enviar").click();
    await tick();
    expect(fetchMock).not.toHaveBeenCalled();
    expect($("#fl-nombre-e").hidden).toBe(false);
    escribir("#fl-nombre", "Laura Mendoza"); escribir("#fl-correo", "laura@empresa.com"); escribir("#fl-empresa", "Acme");
    marcar("#fl-priv");
    $(".fp-form form").dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    await tick(10);
    const b = cuerpoEnviado();
    expect(b).toMatchObject({ firstname: "Laura Mendoza", email: "laura@empresa.com", company: "Acme", acuerdodeprivacidad: true, acepto_recibir_mensajes_de_whatsapp: false });
    expect(b.fuente.canal).toBe("sitio-flotante");
    expect(document.querySelector(".fsent")?.textContent).toContain("Registro creado");
    expect((window as any).catTrack.lead).toHaveBeenCalledWith({ lead_source: "floating_form" });
  });

  it("formulario corto: error del servidor no muestra 'Registro creado'", async () => {
    fetchMock.mockResolvedValue(respuesta(502, { error: "x" }));
    await conFlotantes();
    $(".fbtn--primary").click();
    escribir("#fl-nombre", "Laura"); escribir("#fl-correo", "laura@empresa.com"); escribir("#fl-empresa", "Acme"); marcar("#fl-priv");
    $(".fp-form form").dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    await tick(10);
    expect(document.querySelector(".fsent")).toBeNull();
    expect($("#fl-alerta").hidden).toBe(false);
    expect($<HTMLInputElement>("#fl-nombre").value).toBe("Laura");
    expect($("#fl-enviar").textContent).toBe("Reintentar envío");
  });

  it("asistente: guion completo con consentimiento y guardado solo tras Confirmar (canal agente)", async () => {
    fetchMock.mockResolvedValue(respuesta(201));
    await conFlotantes();
    $(".fbtn--dark").click();
    await tick();
    const chip = (t: string) => ([...document.querySelectorAll(".chat__chip")].find((c) => c.textContent === t) as HTMLElement);
    const decir = (t: string) => { const i = $<HTMLInputElement>("#chat-in"); i.value = t; $(".chat__composer").dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })); };
    expect($(".chat__head").textContent).toContain("Asistente automático");
    chip("Dejar mis datos").click();
    decir("Laura Mendoza"); decir("laura@empresa.com"); decir("Acme");
    chip("CRM y automatización").click();
    expect($(".chat__card")?.textContent).toContain("Consentimiento");
    const continuar = () => ([...document.querySelectorAll(".chat__card button")].find((b) => b.textContent === "Continuar") as HTMLButtonElement);
    expect(continuar().disabled).toBe(true);
    ($("#chat-priv") as HTMLInputElement).click();
    expect(continuar().disabled).toBe(false);
    continuar().click();
    expect($(".chat__card")?.textContent).toContain("Registro por crear");
    expect(fetchMock).not.toHaveBeenCalled();
    chip("Confirmar y guardar").click();
    await tick(10);
    const b = cuerpoEnviado();
    expect(b.fuente.canal).toBe("agente");
    expect(b).toMatchObject({ firstname: "Laura Mendoza", email: "laura@empresa.com", company: "Acme", interes: "CRM y automatización", acuerdodeprivacidad: true, acepto_recibir_mensajes_de_whatsapp: false });
    expect($(".chat__log").textContent).toContain("Registro creado");
    expect((window as any).catTrack.lead).toHaveBeenCalledWith({ lead_source: "agent" });
  });

  it("asistente: si falla el guardado muestra el error y permite reintentar", async () => {
    let intentos = 0;
    fetchMock.mockImplementation(async (url: string) => (String(url).includes("lead-register") && ++intentos === 1 ? respuesta(502) : respuesta(201)));
    await conFlotantes();
    $(".fbtn--dark").click();
    await tick();
    const chip = (t: string) => ([...document.querySelectorAll(".chat__chip")].find((c) => c.textContent === t) as HTMLElement);
    const decir = (t: string) => { const i = $<HTMLInputElement>("#chat-in"); i.value = t; $(".chat__composer").dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })); };
    chip("Dejar mis datos").click();
    decir("Laura"); decir("laura@empresa.com"); decir("Acme"); chip("Otro tema").click();
    ($("#chat-priv") as HTMLInputElement).click();
    ([...document.querySelectorAll(".chat__card button")].find((b) => b.textContent === "Continuar") as HTMLElement).click();
    chip("Confirmar y guardar").click();
    await tick(10);
    expect($(".chat__log").textContent).toContain("No pudimos guardar tu registro");
    expect($(".chat__log").textContent).not.toContain("Registro creado");
    chip("Reintentar").click();
    await tick(10);
    expect($(".chat__log").textContent).toContain("Registro creado");
  });

  it("asistente: el menú ofrece los cinco flujos; hablar con una persona abre WhatsApp y las dudas buscan en el sitio", async () => {
    await conFlotantes();
    $(".fbtn--dark").click();
    await tick();
    const chip = (t: string) => ([...document.querySelectorAll(".chat__chip")].find((c) => c.textContent === t) as HTMLElement);
    const decir = (t: string) => { const i = $<HTMLInputElement>("#chat-in"); i.value = t; $(".chat__composer").dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })); };
    expect($(".chat__clave").textContent).toMatch(/Clave de tu conversación: CAT-[A-Z0-9]{4}-[A-Z0-9]{4}\. Puedes referenciar/);
    const clave1 = $(".chat__clave b").textContent;
    ([...document.querySelectorAll(".ib")].find((b) => b.getAttribute("aria-label") === "Reiniciar la conversación") as HTMLElement).click();
    expect($(".chat__clave b").textContent).not.toBe(clave1);
    for (const t of ["Dejar mis datos", "Agendar diagnóstico", "Dudas sobre servicios", "Recibir el checklist", "Hablar con una persona"]) expect(chip(t)).toBeTruthy();
    expect($(".chat__note").textContent).toContain("aviso de privacidad");
    chip("Hablar con una persona").click();
    const wa = $<HTMLAnchorElement>('.chat__chip[data-cta="chat_whatsapp"]');
    expect(wa.href).toContain("wa.me/525539337086");
    expect(wa.target).toBe("_blank");
    chip("Volver al menú").click();
    decir("migrar a la nube");
    expect($(".chat__log").textContent).toContain("Cloud");
    expect($<HTMLAnchorElement>('.chat__chip[data-cta="chat_servicio"]').getAttribute("href")).toBe("/servicios.html#servicio-3");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("asistente: guarda el historial sin datos del registro; el primer envío lleva el token y los siguientes el sello", async () => {
    fetchMock.mockImplementation(async (url: string) => (String(url).includes("chat-log")
      ? { ok: true, status: 200, json: async () => ({ ok: true, sello: "s".repeat(64) }) } : respuesta(201)));
    await conFlotantes();
    $(".fbtn--dark").click();
    await tick();
    const chip = (t: string) => ([...document.querySelectorAll(".chat__chip")].find((c) => c.textContent === t) as HTMLElement);
    const decir = (t: string) => { const i = $<HTMLInputElement>("#chat-in"); i.value = t; $(".chat__composer").dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })); };
    chip("Dejar mis datos").click();
    decir("Laura Mendoza"); decir("laura@empresa.com"); decir("Acme"); chip("Otro tema").click();
    ($("#chat-priv") as HTMLInputElement).click();
    ([...document.querySelectorAll(".chat__card button")].find((b) => b.textContent === "Continuar") as HTMLElement).click();
    chip("Confirmar y guardar").click();
    await tick(10);
    const envios = llamadasA("chat-log");
    expect(envios.length).toBeGreaterThanOrEqual(1);
    const primero = JSON.parse(envios[0][1].body);
    expect(primero).toMatchObject({ resultado: "registro", turnstileToken: "token-prueba" });
    expect(primero.clave).toMatch(/^CAT-/);
    for (const dato of ["Laura", "laura@empresa.com", "Acme"]) expect(envios.map((c) => c[1].body).join("")).not.toContain(dato);
  });

  it("asistente: mide flujo, resultado y dudas sin respuesta, sin texto del visitante", async () => {
    await conFlotantes();
    $(".fbtn--dark").click();
    await tick();
    const chip = (t: string) => ([...document.querySelectorAll(".chat__chip")].find((c) => c.textContent === t) as HTMLElement);
    const decir = (t: string) => { const i = $<HTMLInputElement>("#chat-in"); i.value = t; $(".chat__composer").dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })); };
    const ev = (window as any).catTrack.event as ReturnType<typeof vi.fn>;
    chip("Agendar diagnóstico").click();
    expect(ev).toHaveBeenCalledWith("asistente_flujo", { flujo: "agendar" });
    expect(ev).toHaveBeenCalledWith("asistente_resultado", { resultado: "agenda" });
    chip("Volver al menú").click();
    decir("quiero un descuento secreto");
    expect(ev).toHaveBeenCalledWith("asistente_sin_respuesta", {});
    decir("migrar a la nube");
    expect(ev).toHaveBeenCalledWith("asistente_flujo", { flujo: "dudas" });
    expect(JSON.stringify(ev.mock.calls)).not.toContain("descuento");
  });

  it("asistente: el primer envío del historial lleva el token y los siguientes el sello; no reenvía si nada cambió", async () => {
    fetchMock.mockImplementation(async (url: string) => (String(url).includes("chat-log")
      ? { ok: true, status: 200, json: async () => ({ ok: true, sello: "s".repeat(64) }) } : respuesta(201)));
    await conFlotantes();
    $(".fbtn--dark").click();
    await tick();
    const chip = (t: string) => ([...document.querySelectorAll(".chat__chip")].find((c) => c.textContent === t) as HTMLElement);
    const decir = (t: string) => { const i = $<HTMLInputElement>("#chat-in"); i.value = t; $(".chat__composer").dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })); };
    chip("Hablar con una persona").click();   // paso 'enlace' → primer envío
    await tick(5);
    chip("Volver al menú").click();
    decir("migrar a la nube");
    $(".chat__head .ib[aria-label='Cerrar']").click();   // cerrar → segundo envío
    await tick(10);
    const envios = llamadasA("chat-log").map((c) => JSON.parse(c[1].body));
    expect(envios).toHaveLength(2);
    expect(envios[0]).toMatchObject({ resultado: "whatsapp", turnstileToken: "token-prueba" });
    expect(envios[1]).toMatchObject({ resultado: "dudas", sello: "s".repeat(64) });
    expect(envios[1].turnstileToken).toBeUndefined();
    expect(envios[0].clave).toBe(envios[1].clave);
    {
      $(".fbtn--dark").click(); await tick();
      $(".chat__head .ib[aria-label='Cerrar']").click(); await tick(10);
      expect(llamadasA("chat-log")).toHaveLength(2);
    }
  });

  it("en Contacto se oculta solo el botón del formulario", async () => {
    vi.resetModules();
    document.body.innerHTML = body("contacto.html");
    await import("/js/flotantes.js");
    expect([...document.querySelectorAll(".fbtn")].map((b) => b.textContent)).toEqual(["Habla con el agente"]);
  });
});

describe("buscador (js/buscador.js)", () => {
  it("abre, busca páginas y servicios, cierra con Esc y devuelve el foco", async () => {
    vi.resetModules();
    document.body.innerHTML = '<button id="op" data-search-open>Buscar</button>';
    fetchMock.mockResolvedValue(respuesta(404));
    const { abrirBuscador } = await import("/js/buscador.js");
    const op = $("#op"); op.focus();
    abrirBuscador(op);
    expect($(".sbox").getAttribute("role")).toBe("dialog");
    expect(document.activeElement?.id).toBe("bus-q");
    escribir("#bus-q", "madurez");
    expect($(".sres").textContent).toContain("Marco de madurez digital");
    escribir("#bus-q", "agentes");
    expect($(".sres").textContent).toContain("Agentes de IA Autónomos");
    escribir("#bus-q", "impuestos 2019");
    expect($(".sres").textContent).toContain("Sin resultados");
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    expect(document.querySelector(".sbk")).toBeNull();
    expect(document.activeElement).toBe(op);
  });
});

describe("blog (js/blog.js)", () => {
  const doc = (id: string, over: Record<string, unknown>) => ({ id, data: () => ({ titulo: `Post ${id}`, resumen: "Resumen", categoria: "CRM", autor: "Equipo", publicado: true, fecha_publicacion: { toDate: () => new Date("2026-09-26T12:00:00Z") }, ...over }) });
  function db(docs: ReturnType<typeof doc>[]) {
    const query = { orderBy: () => query, limit: () => query, get: async () => ({ forEach: (cb: (d: unknown) => void) => docs.forEach(cb) }) };
    return { collection: () => query };
  }
  async function conBlog(docs: ReturnType<typeof doc>[]) {
    vi.resetModules();
    document.body.innerHTML = body("blog.html");
    (window as any).eval(readFileSync(join(ROOT, "js/blog-utils.js"), "utf8").replace(/function (slugify|getPostSlug)/g, "window.$1 = function $1"));
    (window as any).firestoreDb = db(docs);
    await import("/js/blog.js");
    await tick(10);
  }

  it("nunca muestra borradores; el destacado es el más reciente y no se repite en la cuadrícula", async () => {
    await conBlog([doc("a", { titulo: "Reciente" }), doc("b", { titulo: "Borrador secreto", publicado: false }), doc("c", { titulo: "Anterior", categoria: "IA" })]);
    expect(document.body.textContent).not.toContain("Borrador secreto");
    expect($("#destacado").textContent).toContain("Reciente");
    const titulos = [...document.querySelectorAll("#posts-grid h3")].map((h) => h.textContent);
    expect(titulos).toEqual(["Anterior"]);
    expect($("#conteo").textContent).toBe("2 artículos");
    expect(($("#posts-grid a") as HTMLAnchorElement).getAttribute("href")).toBe("/blog-post.html?id=anterior");
  });

  it("filtra por categoría y pagina con 'Cargar más' sin perder posts (más de 12)", async () => {
    const muchos = Array.from({ length: 25 }, (_, i) => doc(`p${i}`, { titulo: `Artículo ${i}`, categoria: i % 2 ? "IA" : "CRM" }));
    await conBlog(muchos);
    expect(document.querySelectorAll("#posts-grid > a")).toHaveLength(9);
    expect($("#mas").hidden).toBe(false);
    $("#cargar-mas").click(); $("#cargar-mas").click();
    expect(document.querySelectorAll("#posts-grid > a")).toHaveLength(24); // 25 menos el destacado
    expect($("#mas").hidden).toBe(true);
    ([...document.querySelectorAll(".fchip")].find((c) => c.textContent === "IA") as HTMLElement).click();
    expect($("#conteo").textContent).toBe("12 artículos");
  });

  it("sin posts muestra el estado vacío; si falla Firestore, el de error con Reintentar", async () => {
    await conBlog([]);
    expect($("#estado-vacio").hidden).toBe(false);
    vi.resetModules();
    document.body.innerHTML = body("blog.html");
    (window as any).firestoreDb = { collection: () => { throw new Error("sin red"); } };
    vi.spyOn(console, "error").mockImplementation(() => {});
    await import("/js/blog.js");
    await tick(10);
    expect($("#estado-error").hidden).toBe(false);
    expect($("#estado-vacio").hidden).toBe(true);
  });
});

describe("shell (js/shell.js)", () => {
  it("el menú móvil abre y cierra con aria-expanded; Esc lo cierra", async () => {
    vi.resetModules();
    document.body.innerHTML = body("index.html");
    await import("/js/shell.js");
    const btn = $("[data-menu-toggle]");
    expect($("#mbar-menu").hidden).toBe(true);
    btn.click();
    expect($("#mbar-menu").hidden).toBe(false);
    expect(btn.getAttribute("aria-expanded")).toBe("true");
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    expect($("#mbar-menu").hidden).toBe(true);
  });

  it("los atajos de una tecla se pueden desactivar y se recuerdan", async () => {
    vi.resetModules();
    localStorage.clear();
    document.body.innerHTML = body("index.html");
    await import("/js/shell.js");
    const t = $("[data-shortcuts-toggle]");
    expect(t.textContent).toContain("activados");
    t.click();
    expect(t.textContent).toContain("desactivados");
    expect(localStorage.getItem("cat_shortcuts")).toBe("off");
    expect(document.querySelector(".nv__key")!.hasAttribute("hidden")).toBe(true);
  });
});

describe("analytics (js/analytics.js)", () => {
  it("cta_click manda cta_id, ubicación y destino, sin datos personales", () => {
    document.body.innerHTML = '<a id="a" href="/evaluacion.html" data-cta="hero_evaluacion" data-cta-location="hero">x</a>';
    const gtag = vi.fn();
    (window as any).gtag = gtag;
    (window as any).eval(leer("js/analytics.js"));
    $("#a").click();
    expect(gtag).toHaveBeenCalledWith("event", "cta_click", expect.objectContaining({ cta_id: "hero_evaluacion", cta_location: "hero", destination: "/evaluacion.html" }));
  });

  it("los enlaces a Calendly salen con los UTM del último toque", () => {
    (window as any).getFuente = () => ({ utmSource: "meta", utmMedium: "social", utmCampaign: "crm" });
    (window as any).eval(leer("js/analytics.js"));
    const url = (window as any).catTrack.calendlyUrl("https://calendly.com/alfonso-piedrabuena-1");
    expect(url).toContain("utm_source=meta");
    expect(url).toContain("utm_campaign=crm");
    expect((window as any).catTrack.calendlyUrl("https://otro.com/x")).toBe("https://otro.com/x");
  });
});
