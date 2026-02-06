/* ====================================
   BLOG - LOAD POSTS FROM FIRESTORE
   ==================================== */

document.addEventListener('DOMContentLoaded', async function() {
    const postsGrid = document.getElementById('posts-grid');
    const loadingPosts = document.getElementById('loading-posts');
    const noPosts = document.getElementById('no-posts');

    try {
        // Check if Firebase is initialized
        if (!window.firestoreDb) {
            throw new Error('Firebase not initialized');
        }

        // Query blog posts from Firestore
        // Posts are ordered by publication date (newest first)
        // Only published posts are shown

        // NOTE: Using orderBy without where to avoid needing composite index
        // We'll filter published posts in JavaScript
        const allPostsSnapshot = await window.firestoreDb
            .collection('blog_posts')
            .orderBy('fecha_publicacion', 'desc')
            .limit(50) // Get more posts to ensure we have enough published ones
            .get();

        // Filter only published posts
        const publishedPosts = [];
        allPostsSnapshot.forEach(doc => {
            const post = doc.data();
            if (post.publicado === true) {
                publishedPosts.push({ id: doc.id, data: post });
            }
        });

        // Create a mock snapshot with only published posts
        const postsSnapshot = {
            empty: publishedPosts.length === 0,
            size: publishedPosts.length,
            forEach: (callback) => publishedPosts.forEach(item =>
                callback({ id: item.id, data: () => item.data })
            )
        };

        // Hide loading state
        loadingPosts.style.display = 'none';

        if (postsSnapshot.empty) {
            // Show "no posts" message
            noPosts.style.display = 'block';
        } else {
            // Show posts grid
            postsGrid.style.display = 'grid';

            // Create post cards
            publishedPosts.slice(0, 12).forEach(item => {
                const postCard = createPostCard(item.data, item.id);
                postsGrid.appendChild(postCard);
            });
        }
    } catch (error) {
        console.error('Error loading blog posts:', error);
        loadingPosts.style.display = 'none';
        noPosts.style.display = 'block';
        noPosts.innerHTML = `
            <h3 style="font-size: 2rem; color: var(--primary); margin-bottom: 1rem;">Error al cargar artículos</h3>
            <p>Por favor, verifica la configuración de Firebase.</p>
        `;
    }
});

/**
 * Create a blog post card element
 * @param {Object} post - Post data from Firestore
 * @param {string} postId - Document ID
 * @returns {HTMLElement} Post card element
 */
function createPostCard(post, postId) {
    const card = document.createElement('a');
    card.href = `blog-post.html?id=${postId}`;
    card.className = 'service-card';
    card.style.textDecoration = 'none';
    card.style.color = 'inherit';

    // Format date
    let formattedDate = '';
    if (post.fecha_publicacion) {
        const date = post.fecha_publicacion.toDate();
        formattedDate = date.toLocaleDateString('es-MX', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    }

    // Truncate summary
    const summary = post.resumen || '';
    const truncatedSummary = summary.length > 150
        ? summary.substring(0, 150) + '...'
        : summary;

    card.innerHTML = `
        ${post.imagen_portada ? `
            <img src="${post.imagen_portada}"
                 alt="${post.titulo}"
                 style="width: 100%; height: 200px; object-fit: cover; margin-bottom: 1.5rem;">
        ` : ''}
        <div class="service-number">${post.categoria || 'General'}</div>
        <h3>${post.titulo}</h3>
        <p>${truncatedSummary}</p>
        <div style="margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid var(--border);">
            <small style="color: var(--text); font-size: 0.85rem;">
                ${post.autor || 'Catalysis'} • ${formattedDate}
            </small>
        </div>
    `;

    return card;
}
