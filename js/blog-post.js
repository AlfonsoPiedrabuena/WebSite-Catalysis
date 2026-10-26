/* ====================================
   BLOG POST: UN ARTÍCULO DESDE FIRESTORE
   Resuelve ?id= (ID legado → campo slug → slug derivado del título), pinta cabecera, cuerpo,
   tags y el cierre (evaluación o recurso descargable según content/recursos.mjs) y suma una
   vista. blog-og.ts ya incrusta el mismo cuerpo en el HTML inicial; aquí se reemplaza
   (innerHTML) sin duplicar. El cuerpo viene sanitizado desde el CRM.
   ==================================== */
import { recursoDePost } from '/content/recursos.mjs';
import { formatearFecha } from '/js/lib/blog-data.mjs';

const $ = (id) => document.getElementById(id);

async function init() {
  const cargando = $('loading-post');
  const noEncontrado = $('post-not-found');
  const contenido = $('post-content');
  const id = new URLSearchParams(location.search).get('id');

  const fallo = () => { cargando.hidden = true; noEncontrado.hidden = false; document.title = 'Artículo no encontrado - Catalysis'; };
  if (!id) { fallo(); return; }

  try {
    if (!window.firestoreDb) throw new Error('Firebase no inicializado');
    const doc = await buscarPost(id);
    if (!doc) throw new Error('Post no encontrado');
    const post = doc.data();
    if (!post.publicado) throw new Error('Post no publicado');

    cargando.hidden = true;
    contenido.hidden = false;
    pintar(post);
    sumarVista(doc.id);
  } catch (error) {
    console.error('Error al cargar el artículo:', error);
    fallo();
  }
}

/** ID de documento (enlaces legados) → campo `slug` → slug derivado del título (50 más recientes). */
async function buscarPost(idOSlug) {
  const posts = window.firestoreDb.collection('blog_posts');
  const porId = await posts.doc(idOSlug).get();
  if (porId.exists) return porId;

  const objetivo = window.slugify(idOSlug);
  const porSlug = await posts.where('slug', '==', idOSlug).limit(1).get();
  if (!porSlug.empty) return porSlug.docs[0];

  const recientes = await posts.orderBy('fecha_publicacion', 'desc').limit(50).get();
  return recientes.docs.find((d) => window.getPostSlug(d.data()) === objetivo) || null;
}

function pintar(post) {
  const titulo = `${post.titulo} - Catalysis`;
  $('post-title').textContent = titulo;
  document.title = titulo;
  $('post-category').textContent = post.categoria || 'BLOG';
  $('post-heading').textContent = post.titulo;

  const fecha = post.fecha_publicacion && post.fecha_publicacion.toDate ? formatearFecha(post.fecha_publicacion.toDate()) : '';
  const meta = [`Por ${post.autor || 'Catalysis'}`, fecha, `${post.vistas || 0} vistas`].filter(Boolean);
  $('post-meta').replaceChildren(...meta.map((t) => Object.assign(document.createElement('span'), { textContent: t })));

  if (post.imagen_portada) {
    const img = $('post-image');
    img.src = post.imagen_portada;
    img.alt = post.titulo;
    img.hidden = false;
  }

  $('post-body').innerHTML = post.contenido || '';

  const tags = Array.isArray(post.tags) ? post.tags : String(post.tags || '').split(',');
  const limpias = tags.map((t) => String(t).trim()).filter(Boolean);
  if (limpias.length) {
    $('tags-list').replaceChildren(...limpias.map((t) => Object.assign(document.createElement('span'), { className: 'tag', textContent: t })));
    $('post-tags').hidden = false;
  }

  const recurso = recursoDePost({ slug: window.getPostSlug(post), categoria: post.categoria });
  if (recurso) {
    $('cierre-etiqueta').textContent = recurso.etiqueta;
    $('cierre-nota').textContent = recurso.nota;
    $('cierre-titulo').textContent = recurso.titulo;
    $('cierre-texto').textContent = recurso.texto;
    const cta = $('cierre-cta');
    cta.textContent = recurso.cta;
    cta.href = recurso.href;
    $('cierre-eval').hidden = true;
    $('cierre-recurso').hidden = false;
  }
}

async function sumarVista(docId) {
  try {
    await window.firestoreDb.collection('blog_posts').doc(docId)
      .update({ vistas: window.firebase.firestore.FieldValue.increment(1) });
  } catch (error) {
    console.error('Error al sumar la vista:', error);
  }
}

init();
