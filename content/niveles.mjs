/* Marco de madurez digital: cinco niveles. Fuente única de marco-madurez.html, marco-madurez.md y la evaluación. */
export const NIVELES = [
  {
    "n": 1,
    "nombre": "Inicial",
    "estado": "Procesos manuales y desconectados",
    "caracteristicas": [
      "Procesos principalmente manuales",
      "Sistemas legacy desconectados",
      "Datos dispersos en múltiples plataformas",
      "Falta de visibilidad en operaciones",
      "Decisiones basadas en intuición",
      "Poco o ningún uso de tecnología en procesos críticos",
      "Sin automatización"
    ],
    "indicadores": [
      "Documentación en Excel o papel",
      "Comunicación principalmente por email",
      "Múltiples sistemas sin integración",
      "Tiempos de proceso largos (días o semanas)",
      "Alta dependencia de personas específicas",
      "Errores manuales frecuentes"
    ],
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
        "texto": "Difícil crecer sin aumentar dramáticamente la operación manual."
      },
      {
        "titulo": "Decisiones",
        "texto": "Información histórica o incompleta."
      },
      {
        "titulo": "Competitividad",
        "texto": "Rezagado frente a competencia digitalmente avanzada."
      }
    ],
    "ejemplos": [
      "Tiendas pequeñas con gestión manual",
      "PyMEs sin ERP",
      "Empresas familiares con procesos tradicionales",
      "Pequeños despachos profesionales"
    ]
  },
  {
    "n": 2,
    "nombre": "En desarrollo",
    "estado": "Algunos sistemas digitales y procesos parcialmente automatizados",
    "caracteristicas": [
      "Algunos procesos digitalizados",
      "Ciertos sistemas implementados (CRM básico, ERP simple)",
      "Automatización en áreas específicas",
      "Inicio de recopilación de datos",
      "Primeros intentos de análisis",
      "Equipos con roles definidos pero sin estructura digital clara",
      "Mejoras ad-hoc, sin estrategia integral"
    ],
    "indicadores": [
      "Al menos un sistema principal (CRM o ERP)",
      "Algunos procesos automatizados",
      "Primeras métricas de seguimiento",
      "Equipos que comienzan a usar tecnología",
      "Datos parcialmente centralizados",
      "Reportes básicos generados"
    ],
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
        "titulo": "Escalabilidad técnica",
        "texto": "Infraestructura no preparada para crecer."
      },
      {
        "titulo": "Adopción",
        "texto": "Resistencia al cambio y baja capacitación."
      },
      {
        "titulo": "ROI limitado",
        "texto": "Inversión en tecnología sin resultados claros."
      }
    ],
    "ejemplos": [
      "Medianas empresas con CRM implementado pero desconectado",
      "Retailers con sistema de POS pero sin integración con finanzas",
      "Manufactureros con ERP antiguo",
      "Consultoras con CRM pero procesos operacionales manuales"
    ]
  },
  {
    "n": 3,
    "nombre": "Intermedia",
    "estado": "Sistemas integrados, pero con brechas de tecnología",
    "caracteristicas": [
      "Infraestructura digital coherente",
      "Sistemas principales integrados",
      "Procesos automatizados en áreas clave",
      "Datos centralizados (Data Warehouse)",
      "Reportes y dashboards regulares",
      "Equipos digitalmente alfabetizados",
      "Estrategia digital definida pero parcialmente implementada"
    ],
    "indicadores": [
      "ERP + CRM + sistemas contables integrados",
      "60% o más de procesos automatizados",
      "Dashboards en tiempo real en áreas críticas",
      "Datos en un repositorio central",
      "Equipos capacitados en herramientas principales",
      "Presupuestos dedicados para transformación",
      "Métricas de negocio claras"
    ],
    "retos": [
      {
        "titulo": "Brechas tecnológicas",
        "texto": "Áreas específicas aún manuales o legacy."
      },
      {
        "titulo": "Escalabilidad cloud",
        "texto": "Infraestructura on-premise limitada."
      },
      {
        "titulo": "Experiencia del cliente",
        "texto": "No hay visión 360° del cliente."
      },
      {
        "titulo": "Velocidad",
        "texto": "Procesos más rápidos, pero no en tiempo real."
      },
      {
        "titulo": "Innovación",
        "texto": "Dificultad para implementar nuevas tecnologías (IA, analytics avanzado)."
      }
    ],
    "ejemplos": [
      "Empresas medianas a grandes con sistemas integrados",
      "Cadenas de tiendas con POS + ERP + CRM",
      "Manufactureros con MES + ERP",
      "Instituciones financieras con sistemas principales integrados",
      "Grandes consultoras con gestión de proyectos digital"
    ]
  },
  {
    "n": 4,
    "nombre": "Avanzada",
    "estado": "Infraestructura moderna, buscando optimización e innovación",
    "caracteristicas": [
      "100% de procesos core digitalizados y automatizados",
      "Infraestructura completamente en la nube",
      "Datos integrados, consistentes, en tiempo real",
      "Analytics avanzados y predicción básica",
      "Comenzando a usar IA en áreas específicas",
      "Experiencia del cliente omnicanal",
      "Equipos con habilidades digitales avanzadas",
      "Cultura de mejora continua establecida"
    ],
    "indicadores": [
      "95% o más de procesos automatizados o digitalizados",
      "Infraestructura 100% cloud-native",
      "Data lake o data warehouse consolidado",
      "ML/IA básico en operaciones (detección de anomalías, predicción)",
      "NPS mejorado, clientes acceden a múltiples canales",
      "Equipos con especialistas en datos",
      "Ciclo de innovación establecido (trimestral)"
    ],
    "retos": [
      {
        "titulo": "Optimización continua",
        "texto": "Cómo exprimir el máximo valor de la tecnología existente."
      },
      {
        "titulo": "Escalabilidad inteligente",
        "texto": "Automatización más allá de procesos, hasta la toma de decisiones."
      },
      {
        "titulo": "Experiencia hiperpersonalizada",
        "texto": "Pasar de omnicanal a 1-to-1."
      },
      {
        "titulo": "Agility",
        "texto": "Necesidad de velocidad en la actualización de sistemas."
      },
      {
        "titulo": "Talento",
        "texto": "Retener especialistas en IA y datos."
      }
    ],
    "ejemplos": [
      "Grandes retailers con omnicanalidad completa",
      "Bancos digitales nativos o modernizados",
      "E-commerce consolidado",
      "Manufactureros con Industria 4.0 en plantas",
      "Consultoras con proptech o insuretech integrado"
    ]
  },
  {
    "n": 5,
    "nombre": "Líder",
    "estado": "Transformación digital completa e innovación continua",
    "caracteristicas": [
      "Ecosistema digital completamente integrado",
      "IA y ML embebidas en toda la organización",
      "Automatización inteligente (agentes autónomos 24/7)",
      "Decisiones impulsadas por datos en tiempo real",
      "Experiencia del cliente hiperpersonalizada",
      "Modelo de negocio digital innovador",
      "Cultura de datos e innovación corporativa",
      "Capacidad de pivotar rápidamente"
    ],
    "indicadores": [
      "100% de procesos digitalizados e inteligentes",
      "Agentes de IA con toma de decisiones autónoma",
      "Revenue stream digital significativo",
      "NPS mayor a 70 y valor de vida del cliente mejorado 3x o más",
      "Ciclo de innovación mensual o semanal",
      "Equipos multidisciplinarios (datos, ingeniería, producto)",
      "Inversión en R&D de tecnología"
    ],
    "retos": [
      {
        "titulo": "Diferenciación",
        "texto": "Mantener la ventaja competitiva en un mercado saturado."
      },
      {
        "titulo": "Escalabilidad global",
        "texto": "Expansión a nuevos mercados manteniendo la innovación."
      },
      {
        "titulo": "Ética y compliance",
        "texto": "Gobernanza de IA, privacidad y regulación."
      },
      {
        "titulo": "Retención de talento",
        "texto": "Atraer a los mejores en IA y datos."
      },
      {
        "titulo": "Anticipación",
        "texto": "Estar adelante de las tendencias de mercado."
      }
    ],
    "ejemplos": [
      "Amazon, Netflix y Tesla (empresas nativas digitales)",
      "Grandes bancos con pilar de innovación digital",
      "Retailers como Walmart o El Corte Inglés modernizado",
      "Startups unicornio con IA en el núcleo",
      "Consultoras con ofertas digitales propias"
    ]
  }
];

export const USOS = [
  {
    "verbo": "Identificar",
    "texto": "En qué etapa de su transformación digital se encuentra tu empresa."
  },
  {
    "verbo": "Reconocer",
    "texto": "Los retos y oportunidades específicas de tu nivel."
  },
  {
    "verbo": "Planificar",
    "texto": "El camino hacia la transformación digital completa."
  },
  {
    "verbo": "Medir",
    "texto": "El progreso y validar las mejoras implementadas."
  }
];
