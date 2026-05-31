document.addEventListener('DOMContentLoaded', async () => {
    // Sync cart count from localStorage if needed, or just initialize
    // For now we just use a local variable like in app.js
    let cartCount = 0;
    const cartCountElement = document.querySelector('.cart-count');

    // Get ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    if (!productId) {
        showError();
        return;
    }

    try {
        const response = await fetch(`/api/products/${productId}`);
        
        if (!response.ok) {
            throw new Error('Producto no encontrado');
        }

        const product = await response.json();
        renderProductDetails(product);

    } catch (error) {
        console.error('Error fetching product details:', error);
        showError();
    }

    // Setup Add to Cart functionality
    document.getElementById('detailAddBtn').addEventListener('click', (e) => {
        cartCount++;
        cartCountElement.textContent = cartCount;
        
        const btn = e.target;
        const originalText = btn.textContent;
        btn.textContent = "¡Añadido al Carrito!";
        btn.style.background = "#10b981"; // success green
        
        // Animate cart icon
        const cartIcon = document.querySelector('.cart-icon');
        cartIcon.style.transform = "scale(1.3)";
        
        setTimeout(() => {
            btn.textContent = originalText;
            btn.style.background = "var(--primary-color)";
            cartIcon.style.transform = "scale(1)";
        }, 1500);
    });
});

function renderProductDetails(product) {
    // Hide loading, show card
    document.getElementById('loadingState').style.display = 'none';
    document.getElementById('productDetailCard').style.display = 'grid';

    // Populate data
    const imgEl = document.getElementById('detailImage');
    imgEl.src = product.image;
    imgEl.onerror = () => { imgEl.src = 'https://images.unsplash.com/photo-1555529771-835f59bfc50c?auto=format&fit=crop&w=600&q=80'; };
    
    document.getElementById('detailTitle').textContent = product.title;
    document.getElementById('detailPrice').textContent = `$${product.price.toFixed(2)}`;
    document.getElementById('detailCondition').textContent = product.condition || 'Usado';
    document.getElementById('detailCategory').textContent = getCategoryName(product.category);
}

function showError() {
    document.getElementById('loadingState').style.display = 'none';
    document.getElementById('productDetailCard').style.display = 'none';
    document.getElementById('errorState').style.display = 'block';
}

function getCategoryName(cat) {
    const categories = {
        electronics: "Electrónica",
        home: "Hogar",
        clothing: "Ropa"
    };
    return categories[cat] || cat;
}
