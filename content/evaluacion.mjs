/* Banco de la evaluación de madurez (6 preguntas, una opción por nivel). Aprobado por Poncho el 2026-10-26. */
export const PREGUNTAS = [
  {
    "dimension": "Procesos",
    "pregunta": "¿Cómo describirías la operación de tu empresa?",
    "opciones": [
      "Casi todo se hace de forma manual, en Excel o en papel.",
      "Algunos procesos están digitalizados, pero las mejoras son sueltas.",
      "Los procesos clave están automatizados e integrados.",
      "Casi todos los procesos core están digitalizados y automatizados.",
      "Los procesos son digitales y además inteligentes."
    ]
  },
  {
    "dimension": "Sistemas",
    "pregunta": "¿Qué tan conectados están tus sistemas?",
    "opciones": [
      "Sistemas legacy o herramientas sueltas, sin integración.",
      "Tenemos un sistema principal (CRM o ERP), pero está aislado.",
      "ERP, CRM y contabilidad están integrados en lo principal.",
      "Infraestructura moderna y completamente en la nube.",
      "Un ecosistema digital completamente integrado."
    ]
  },
  {
    "dimension": "Datos",
    "pregunta": "¿Cómo manejas tus datos y reportes?",
    "opciones": [
      "Los datos están dispersos y decidimos por intuición.",
      "Empezamos a recopilar datos y generamos reportes básicos.",
      "Datos centralizados, con dashboards regulares.",
      "Datos en tiempo real y analítica avanzada con predicción básica.",
      "Decisiones impulsadas por datos en tiempo real en toda la organización."
    ]
  },
  {
    "dimension": "Experiencia del cliente",
    "pregunta": "¿Cómo es la experiencia digital de tus clientes?",
    "opciones": [
      "Atención principalmente por email o teléfono.",
      "Algunos canales digitales, sin una vista unificada del cliente.",
      "Buenos canales digitales, pero sin visión 360° del cliente.",
      "Experiencia omnicanal consolidada.",
      "Experiencia hiperpersonalizada."
    ]
  },
  {
    "dimension": "IA y automatización",
    "pregunta": "¿Qué papel juega hoy la inteligencia artificial en tu empresa?",
    "opciones": [
      "No usamos IA ni automatización.",
      "Automatizamos tareas puntuales en áreas específicas.",
      "Tenemos una estrategia digital definida, pero la IA aún es un reto.",
      "Comenzamos a usar IA y ML en áreas específicas de la operación.",
      "IA y agentes autónomos embebidos en la organización."
    ]
  },
  {
    "dimension": "Equipo y cultura",
    "pregunta": "¿Cómo describirías las capacidades digitales de tu equipo?",
    "opciones": [
      "Hay alta dependencia de personas específicas y poca tecnología.",
      "Roles definidos, pero sin estructura digital clara y con resistencia al cambio.",
      "Equipos alfabetizados digitalmente y con presupuesto dedicado.",
      "Equipos con habilidades digitales avanzadas y mejora continua.",
      "Equipos multidisciplinarios (datos, ingeniería, producto) con cultura de innovación."
    ]
  }
];

export const RESULTADOS = [
  {
    "n": 1,
    "nombre": "Inicial",
    "estado": "Procesos manuales y desconectados.",
    "retos": [
      {
        "titulo": "Visibilidad",
        "texto": "No hay claridad sobre procesos y resultados."
      },
      {
        "titulo": "Eficiencia",
        "texto": "Procesos lentos, repetitivos y propensos a errores."
      },
      {
        "titulo": "Escalabilidad",
        "texto": "Difícil crecer sin aumentar la operación manual."
      }
    ]
  },
  {
    "n": 2,
    "nombre": "En desarrollo",
    "estado": "Algunos sistemas digitales y procesos parcialmente automatizados.",
    "retos": [
      {
        "titulo": "Integración",
        "texto": "Sistemas aislados que no se comunican."
      },
      {
        "titulo": "Inconsistencia",
        "texto": "Datos duplicados o contradictorios."
      },
      {
        "titulo": "Adopción",
        "texto": "Resistencia al cambio y baja capacitación."
      }
    ]
  },
  {
    "n": 3,
    "nombre": "Intermedia",
    "estado": "Sistemas integrados, pero con brechas de tecnología.",
    "retos": [
      {
        "titulo": "Brechas tecnológicas",
        "texto": "Áreas específicas aún manuales o legacy."
      },
      {
        "titulo": "Experiencia del cliente",
        "texto": "No hay visión 360° del cliente."
      },
      {
        "titulo": "Innovación",
        "texto": "Dificultad para implementar IA y analytics avanzado."
      }
    ]
  },
  {
    "n": 4,
    "nombre": "Avanzada",
    "estado": "Infraestructura moderna, buscando optimización e innovación.",
    "retos": [
      {
        "titulo": "Optimización continua",
        "texto": "Exprimir el máximo valor de la tecnología existente."
      },
      {
        "titulo": "Escalabilidad inteligente",
        "texto": "Automatizar hasta la toma de decisiones."
      },
      {
        "titulo": "Talento",
        "texto": "Retener especialistas en IA y datos."
      }
    ]
  },
  {
    "n": 5,
    "nombre": "Líder",
    "estado": "Transformación digital completa e innovación continua.",
    "retos": [
      {
        "titulo": "Diferenciación",
        "texto": "Mantener la ventaja competitiva en un mercado saturado."
      },
      {
        "titulo": "Ética y compliance",
        "texto": "Gobernanza de IA, privacidad y regulación."
      },
      {
        "titulo": "Anticipación",
        "texto": "Estar adelante de las tendencias de mercado."
      }
    ]
  }
];
