/* Recursos gratuitos y su relación con el blog. El "recurso relacionado" NO existe en Firestore:
   se define aquí, por slug o por categoría, sin tocar el esquema de blog_posts.
   Los slugs deben coincidir con slugify() (js/blog-utils.js). */

export const RECURSOS = {
  'checklist-cierre-fiscal': {
    etiqueta: 'Checklist',
    nota: 'Descarga gratis',
    titulo: 'Checklist de cierre fiscal digital para PyMEs',
    texto: 'Todo lo que tu PyME debe revisar antes de que cierre el año fiscal: comprobantes, complementos de pago y datos de clientes.',
    cta: 'Descargar checklist',
    href: '/recursos/checklist-cierre-fiscal.html',
    descargable: true,
  },
};

/** Artículos que son (o llevan a) un recurso descargable: badge "Descargable" y cierre con recurso. */
export const RECURSO_POR_SLUG = {
  checklist_de_cierre_fiscal_digital_para_pymes: 'checklist-cierre-fiscal',
};

/** Categorías de Firestore cuyo cierre de artículo ofrece un recurso en lugar de la evaluación. */
export const RECURSO_POR_CATEGORIA = {
  'Facturación y Fiscal': 'checklist-cierre-fiscal',
};

/** id de recurso para un post ({ slug, categoria }) o null → el cierre es la evaluación. */
export function recursoDePost({ slug, categoria }) {
  const id = RECURSO_POR_SLUG[slug] || RECURSO_POR_CATEGORIA[categoria] || null;
  return id ? { id, ...RECURSOS[id] } : null;
}
