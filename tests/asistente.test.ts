import { describe, expect, it } from "vitest";
import {
  chips, datosParaLead, enlaces, estadoInicial, filasConfirmacion, reducir, INTERESES,
} from "../js/lib/asistente.mjs";

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

  it("texto libre en un paso de opciones: no entiende y ofrece formulario y calendario", () => {
    const e = correr([{ tipo: "texto", valor: "cuánto cuesta un CRM" }]);
    expect(e.noEntendido).toBe(true);
    expect(e.paso).toBe("bienvenida");
    expect(chips(e).map((c) => c.id)).toContain("formulario");
    expect(enlaces(e).some((l) => l.href.includes("calendly"))).toBe(true);
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
