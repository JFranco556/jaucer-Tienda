let products = [];


// DOM Elements
const productsGrid = document.getElementById('productsGrid');
const filterBtns = document.querySelectorAll('.filter-btn');

const navbar = document.querySelector('.navbar');

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    await fetchProducts();
    setupFilters();
});

async function fetchProducts() {
    try {
        const response = await fetch('/api/products');
        products = await response.json();
        renderProducts(products);
    } catch (error) {
        console.error('Error fetching products:', error);
        productsGrid.innerHTML = '<p style="text-align:center;width:100%;">Error al cargar los productos. Por favor, intenta de nuevo más tarde.</p>';
    }
}

// Render Products
function renderProducts(productsToRender) {
    productsGrid.innerHTML = ''; // Clear current
    
    if (productsToRender.length === 0) {
        productsGrid.innerHTML = '<p style="text-align:center;width:100%;">No hay productos disponibles por el momento.</p>';
        return;
    }
    
    productsToRender.forEach(product => {
        const productEl = document.createElement('div');
        productEl.classList.add('product-card');
        
        productEl.innerHTML = `
            <div class="image-wrapper">
                <span class="badge">${product.condition}</span>
                <img src="${product.image}" alt="${product.title}" class="product-image" onerror="this.src='https://images.unsplash.com/photo-1555529771-835f59bfc50c?auto=format&fit=crop&w=600&q=80';">
            </div>
            <div class="product-info">
                <span class="product-category">${getCategoryName(product.category)}</span>
                <h4 class="product-title">${product.title}</h4>
                <div class="product-price">$${product.price.toFixed(2)}</div>
                <button class="add-to-cart-btn" onclick="addToCart(event, '${product._id}')">Añadir al Carrito</button>
            </div>
        `;
        
        productEl.style.cursor = 'pointer';
        productEl.onclick = (e) => {
            if(!e.target.classList.contains('add-to-cart-btn')) {
                window.location.href = `product.html?id=${product._id}`;
            }
        };
        
        productsGrid.appendChild(productEl);
    });
}

function getCategoryName(cat) {
    const categories = {
        electronics: "Electrónica",
        home: "Hogar",
        clothing: "Ropa"
    };
    return categories[cat] || cat;
}

// Setup Filtering
function setupFilters() {
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all
            filterBtns.forEach(b => b.classList.remove('active'));
            // Add active class to clicked
            btn.classList.add('active');
            
            const filterValue = btn.getAttribute('data-filter');
            
            if (filterValue === 'all') {
                renderProducts(products);
            } else {
                const filteredProducts = products.filter(p => p.category === filterValue);
                renderProducts(filteredProducts);
            }
        });
    });
}

// Add to Cart Interaction
window.addToCart = function(event, productId) {
    event.preventDefault();
    const product = products.find(p => p._id === productId);
    if(product) {
        window.addToCartGlobal(product);
        
        // Add simple animation
        const btn = event.target;
        const originalText = btn.textContent;
        btn.textContent = "¡Añadido!";
        btn.style.background = "var(--primary-color)";
        btn.style.color = "white";
        
        setTimeout(() => {
            btn.textContent = originalText;
            btn.style.background = "transparent";
            btn.style.color = "var(--text-main)";
        }, 1500);
    }
}

// Navbar Scroll Effect
window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        navbar.style.background = "rgba(15, 23, 42, 0.95)";
        navbar.style.boxShadow = "0 4px 20px rgba(0, 0, 0, 0.2)";
    } else {
        navbar.style.background = "var(--glass-bg)";
        navbar.style.boxShadow = "none";
    }
});
