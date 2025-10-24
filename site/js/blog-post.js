/* ====================================
   BLOG POST - LOAD SINGLE POST FROM FIRESTORE
   ==================================== */

document.addEventListener('DOMContentLoaded', async function() {
    const loadingPost = document.getElementById('loading-post');
    const postNotFound = document.getElementById('post-not-found');
    const postContent = document.getElementById('post-content');

    // Get post ID from URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get('id');

    if (!postId) {
        loadingPost.style.display = 'none';
        postNotFound.style.display = 'block';
        return;
    }

    try {
        // Check if Firebase is initialized
        if (!window.firestoreDb) {
            throw new Error('Firebase not initialized');
        }

        // Get post from Firestore
        const postDoc = await window.firestoreDb
            .collection('blog_posts')
            .doc(postId)
            .get();

        if (!postDoc.exists) {
            throw new Error('Post not found');
        }

        const post = postDoc.data();

        // Check if post is published
        if (!post.publicado) {
            throw new Error('Post not published');
        }

        // Hide loading, show content
        loadingPost.style.display = 'none';
        postContent.style.display = 'block';

        // Populate post data
        populatePost(post, postId);

        // Increment view count
        incrementViewCount(postId);

    } catch (error) {
        console.error('Error loading blog post:', error);
        loadingPost.style.display = 'none';
        postNotFound.style.display = 'block';
    }
});

/**
 * Populate post content in the page
 * @param {Object} post - Post data from Firestore
 * @param {string} postId - Document ID
 */
function populatePost(post, postId) {
    // Update page title
    document.getElementById('post-title').textContent = `${post.titulo} - Catalysis`;
    document.title = `${post.titulo} - Catalysis`;

    // Update category
    const categoryEl = document.getElementById('post-category');
    categoryEl.textContent = post.categoria || 'BLOG';

    // Update heading
    const headingEl = document.getElementById('post-heading');
    headingEl.textContent = post.titulo;

    // Update meta info
    const metaEl = document.getElementById('post-meta');
    let formattedDate = '';
    if (post.fecha_publicacion) {
        const date = post.fecha_publicacion.toDate();
        formattedDate = date.toLocaleDateString('es-MX', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    }
    metaEl.innerHTML = `
        <span>Por ${post.autor || 'Catalysis'}</span>
        <span>${formattedDate}</span>
        <span>${post.vistas || 0} vistas</span>
    `;

    // Update image (if exists)
    if (post.imagen_portada) {
        const imageEl = document.getElementById('post-image');
        imageEl.src = post.imagen_portada;
        imageEl.alt = post.titulo;
        imageEl.style.display = 'block';
    }

    // Update post body
    const bodyEl = document.getElementById('post-body');
    bodyEl.innerHTML = post.contenido || '';

    // Update tags (if exists)
    if (post.tags && post.tags.length > 0) {
        const tagsContainer = document.getElementById('post-tags');
        const tagsList = document.getElementById('tags-list');

        const tagsArray = Array.isArray(post.tags) ? post.tags : post.tags.split(',');
        const tagsHTML = tagsArray.map(tag => `
            <span style="display: inline-block; padding: 0.4rem 1rem; background: var(--secondary);
                         border: 1px solid var(--border); margin-right: 0.5rem; margin-bottom: 0.5rem;
                         font-size: 0.85rem;">
                ${tag.trim()}
            </span>
        `).join('');

        tagsList.innerHTML = tagsHTML;
        tagsContainer.style.display = 'block';
    }
}

/**
 * Increment view count for the post
 * @param {string} postId - Document ID
 */
async function incrementViewCount(postId) {
    try {
        if (!window.firestoreDb) return;

        await window.firestoreDb
            .collection('blog_posts')
            .doc(postId)
            .update({
                vistas: firebase.firestore.FieldValue.increment(1)
            });
    } catch (error) {
        console.error('Error incrementing view count:', error);
    }
}
