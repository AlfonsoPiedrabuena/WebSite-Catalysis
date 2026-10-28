import { describe, expect, it } from "vitest";
import {
  chips, datosParaLead, enlaces, estadoInicial, filasConfirmacion, reducir, INTERESES, WHATSAPP, generarClave,
} from "../js/lib/asistente.mjs";
import { buscarDuda } from "../js/lib/buscador-dudas.mjs";

type Ev = Parameters<typeof reducir>[1];
const correr = (acts: Ev[], desde = estadoInicial()) => acts.reduce((s, a) => reducir(s, a), desde);
const hastaInteres: Ev[] = [
  { tipo: "iniciar" }, { tipo: "texto", valor: "Laura Mendoza" },
  { tipo: "texto", valor: "laura@empresa.com" }, { tipo: "texto", valor: "Acme" },
];
const hastaConsentimiento: Ev[] = [...hastaInteres, { tipo: "elegir", valor: INTERESES[0] }];
const hastaConfirmar: Ev[] = [...hastaConsentimiento, { tipo: "alternar_consentimiento", valor: "priv" }, { tipo: "aceptar_consentimiento" }];

describe("flujo feliz", () => {
  it("bienvenida → nombre → correo → empresa → interés → consentimiento → confirmar", () => {
    expect(estadoInicial().paso).toBe("bienvenida");
    expect(correr([{ tipo: "iniciar" }]).paso).toBe("nombre");
    expect(correr(hastaInteres).paso).toBe("interes");
    expect(correr(hastaConsentimiento).paso).toBe("consentimiento");
    const e = correr(hastaConfirmar);
    expect(e.paso).toBe("confirmar");
    expect(e.registro).toMatchObject({ nombre: "Laura Mendoza", correo: "laura@empresa.com", empresa: "Acme", interes: INTERESES[0] });
  });

  it("solo guarda tras Confirmar; el éxito muestra el registro creado", () => {
    let e = correr(hastaConfirmar);
    expect(e.paso).not.toBe("guardando");
    e = reducir(e, { tipo: "confirmar" });
    expect(e.paso).toBe("guardando");
    e = reducir(e, { tipo: "guardado" });
    expect(e.paso).toBe("hecho");
    expect(e.mensajes.at(-1)?.texto).toContain("laura@empresa.com");
  });

  it("datosParaLead entrega valores y consentimientos para construirPayload", () => {
    const { valores, interes } = datosParaLead(correr(hastaConfirmar));
    expect(valores).toMatchObject({ nombre: "Laura Mendoza", priv: true, wa: false });
    expect(interes).toBe(INTERESES[0]);
  });
});

describe("consentimiento", () => {
  it("no se puede continuar sin aceptar el aviso de privacidad", () => {
    const e = correr([...hastaConsentimiento, { tipo: "aceptar_consentimiento" }]);
    expect(e.paso).toBe("consentimiento");
  });

  it("WhatsApp es opcional, empieza sin marcar y pide teléfono solo si se acepta", () => {
    expect(correr(hastaConsentimiento).consentimientos).toEqual({ priv: false, wa: false });
    const e = correr([...hastaConsentimiento, { tipo: "alternar_consentimiento", valor: "priv" }, { tipo: "alternar_consentimiento", valor: "wa" }, { tipo: "aceptar_consentimiento" }]);
    expect(e.paso).toBe("telefono");
    expect(chips(e).map((c) => c.id)).toEqual(["omitir"]);
    expect(correr([{ tipo: "omitir_telefono" }], e).paso).toBe("confirmar");
  });
});

describe("validación y errores", () => {
  it("correo inválido: avisa y se queda en el paso", () => {
    const e = correr([{ tipo: "iniciar" }, { tipo: "texto", valor: "Laura" }, { tipo: "texto", valor: "laura@empresa" }]);
    expect(e.paso).toBe("correo");
    expect(e.campoInvalido).toBe("correo");
    expect(e.mensajes.at(-1)?.tipo).toBe("error");
  });

  it("teléfono inválido se rechaza", () => {
    const e = correr([...hastaConsentimiento, { tipo: "alternar_consentimiento", valor: "priv" }, { tipo: "alternar_consentimiento", valor: "wa" }, { tipo: "aceptar_consentimiento" }, { tipo: "texto", valor: "abc" }]);
    expect(e.paso).toBe("telefono");
    expect(e.campoInvalido).toBe("tel");
  });

  it("texto libre sin coincidencia en el menú: lo dice y ofrece formulario, calendario y WhatsApp", () => {
    const e = correr([{ tipo: "texto", valor: "quiero un descuento" }]);
    expect(e.noEntendido).toBe(true);
    expect(e.paso).toBe("bienvenida");
    expect(chips(e).map((c) => c.id)).toContain("formulario");
    expect(chips(e).map((c) => c.id)).not.toContain("continuar");
    expect(enlaces(e).map((l) => l.cta)).toEqual(["chat_calendly", "chat_whatsapp"]);
  });

  it("texto libre en un paso del registro (consentimiento): no entiende y permite continuar", () => {
    const e = correr([...hastaConsentimiento, { tipo: "texto", valor: "hola" }]);
    expect(e.noEntendido).toBe(true);
    expect(e.paso).toBe("consentimiento");
    expect(chips(e).map((c) => c.id)).toContain("continuar");
  });

  it("error al guardar conserva los datos y permite reintentar", () => {
    let e = correr([...hastaConfirmar, { tipo: "confirmar" }, { tipo: "fallo" }]);
    expect(e.paso).toBe("error");
    expect(e.registro.correo).toBe("laura@empresa.com");
    expect(chips(e).map((c) => c.id)).toEqual(["reintentar", "formulario"]);
    e = reducir(e, { tipo: "reintentar" });
    expect(e.paso).toBe("guardando");
  });
});

describe("corregir y reiniciar", () => {
  it("corregir un campo vuelve a la confirmación", () => {
    let e = correr([...hastaConfirmar, { tipo: "corregir" }, { tipo: "elegir_campo", valor: "empresa" }]);
    expect(e.paso).toBe("empresa");
    e = reducir(e, { tipo: "texto", valor: "Otra SA" });
    expect(e.paso).toBe("confirmar");
    expect(e.registro.empresa).toBe("Otra SA");
    expect(filasConfirmacion(e).find(([k]) => k === "Empresa")?.[1]).toBe("Otra SA");
  });

  it("reiniciar borra todo", () => {
    expect(correr([{ tipo: "reiniciar" }], correr(hastaConfirmar))).toEqual(estadoInicial());
  });

  it("no muta el estado anterior", () => {
    const antes = estadoInicial();
    const copia = JSON.stringify(antes);
    reducir(antes, { tipo: "iniciar" });
    expect(JSON.stringify(antes)).toBe(copia);
  });

  it("eventos fuera de lugar se ignoran (no se puede confirmar desde la bienvenida)", () => {
    const e = estadoInicial();
    expect(reducir(e, { tipo: "confirmar" })).toBe(e);
    expect(reducir(e, { tipo: "guardado" })).toBe(e);
  });
});

describe("menú y flujos", () => {
  it("el menú ofrece los cinco flujos y el formulario", () => {
    expect(chips(estadoInicial()).map((c) => c.id)).toEqual([
      "flujo:datos", "flujo:agendar", "flujo:dudas", "flujo:checklist", "flujo:persona", "formulario",
    ]);
  });

  it("dejar mis datos arranca el registro y queda anotado en flujos", () => {
    const e = correr([{ tipo: "elegir_flujo", valor: "datos" }]);
    expect(e.paso).toBe("nombre");
    expect(e.flujos).toEqual(["datos"]);
  });

  it("agendar, checklist y persona solo ofrecen un enlace y permiten volver al menú", () => {
    const esperado: Record<string, [string, string]> = {
      agendar: ["chat_calendly", "calendly.com"],
      checklist: ["chat_checklist", "/recursos/checklist-cierre-fiscal.html"],
      persona: ["chat_whatsapp", "wa.me/525539337086"],
    };
    for (const [flujo, [cta, href]] of Object.entries(esperado)) {
      const e = correr([{ tipo: "elegir_flujo", valor: flujo }]);
      expect(e.paso).toBe("enlace");
      expect(enlaces(e)).toHaveLength(1);
      expect(enlaces(e)[0].cta).toBe(cta);
      expect(enlaces(e)[0].href).toContain(href);
      expect(chips(e).map((c) => c.id)).toEqual(["menu"]);
      const vuelta = reducir(e, { tipo: "menu" });
      expect(vuelta.paso).toBe("bienvenida");
      expect(enlaces(vuelta)).toEqual([]);
    }
  });

  it("el enlace de WhatsApp usa el número acordado y un mensaje prellenado", () => {
    const u = new URL(WHATSAPP);
    expect(u.pathname).toBe("/525539337086");
    expect(u.searchParams.get("text")).toContain("Catalysis");
  });

  it("dudas: pide la palabra, sugiere temas y responde con resumen y ligas", () => {
    let e = correr([{ tipo: "elegir_flujo", valor: "dudas" }]);
    expect(e.paso).toBe("dudas");
    expect(chips(e).map((c) => c.id)).toContain("tema:Nube");
    e = reducir(e, { tipo: "texto", valor: "migrar a la nube" });
    expect(e.paso).toBe("dudas");
    expect(e.noEntendido).toBe(false);
    expect(e.mensajes.some((m) => m.rol === "bot" && m.texto.includes("Cloud"))).toBe(true);
    expect(enlaces(e)[0].href).toBe("/servicios.html#servicio-3");
    expect(enlaces(e)[0].cta).toBe("chat_servicio");
    expect(chips(e).map((c) => c.id)).toEqual(["menu"]);
  });

  it("escribir una duda directo en el menú también busca", () => {
    const e = correr([{ tipo: "texto", valor: "automatizar procesos" }]);
    expect(e.paso).toBe("dudas");
    expect(e.flujos).toEqual(["dudas"]);
    expect(enlaces(e).length).toBeGreaterThan(0);
  });

  it("una duda sin respuesta en 'dudas' no inventa nada y mantiene los temas", () => {
    const e = correr([{ tipo: "elegir_flujo", valor: "dudas" }, { tipo: "texto", valor: "quiero un descuento" }]);
    expect(e.paso).toBe("dudas");
    expect(e.noEntendido).toBe(true);
    expect(e.mensajes.at(-1)?.texto).toContain("No encontré");
    expect(chips(e).map((c) => c.id)).toContain("tema:Nube");
  });

  it("durante el registro el texto libre sigue siendo un campo, no una búsqueda", () => {
    const e = correr([{ tipo: "iniciar" }, { tipo: "texto", valor: "automatización" }]);
    expect(e.paso).toBe("correo");
    expect(e.registro.nombre).toBe("automatización");
  });

  it("tras el registro ofrece evaluación, calendario y checklist", () => {
    const e = correr([...hastaConfirmar, { tipo: "confirmar" }, { tipo: "guardado" }]);
    expect(enlaces(e).map((l) => l.cta)).toEqual(["chat_evaluacion", "chat_calendly", "chat_checklist"]);
  });

  it("elegir_flujo fuera del menú se ignora (no se puede saltar el registro)", () => {
    const e = correr(hastaConsentimiento);
    expect(reducir(e, { tipo: "elegir_flujo", valor: "persona" })).toBe(e);
  });
});

describe("buscarDuda", () => {
  it("encuentra servicios, el marco, el checklist y el aviso por sus palabras", () => {
    expect(buscarDuda("automatizar procesos")[0].id).toBe("servicio-2");
    expect(buscarDuda("qué es el marco de madurez")[0].id).toBe("marco");
    expect(buscarDuda("factura CFDI")[0].id).toBe("checklist");
    expect(buscarDuda("privacidad de mis datos")[0].id).toBe("privacidad");
  });

  it("ignora acentos, mayúsculas y palabras vacías", () => {
    expect(buscarDuda("AUTOMATIZACIÓN")[0].id).toBe(buscarDuda("automatizacion")[0].id);
    expect(buscarDuda("de la en el")).toEqual([]);
  });

  it("sin coincidencia devuelve vacío, y nunca más de 3", () => {
    expect(buscarDuda("quiero un descuento")).toEqual([]);
    expect(buscarDuda("")).toEqual([]);
    expect(buscarDuda("datos procesos nube").length).toBeLessThanOrEqual(3);
  });
});

describe("clave de conversación", () => {
  it("generarClave da un formato legible y distinto cada vez", () => {
    const a = generarClave(); const b = generarClave();
    expect(a).toMatch(/^CAT-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/);
    expect(a).not.toBe(b);
  });

  it("el estado la conserva en todo el flujo; reiniciar usa la nueva", () => {
    const e = correr([{ tipo: "iniciar" }, { tipo: "texto", valor: "Laura" }], estadoInicial("CAT-AAAA-BBBB"));
    expect(e.clave).toBe("CAT-AAAA-BBBB");
    expect(reducir(e, { tipo: "reiniciar", clave: "CAT-CCCC-DDDD" }).clave).toBe("CAT-CCCC-DDDD");
  });
});
