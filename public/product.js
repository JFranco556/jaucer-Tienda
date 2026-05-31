document.addEventListener('DOMContentLoaded', async () => {


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


});

function renderProductDetails(product) {
    // Hide loading, show card
    document.getElementById('loadingState').style.display = 'none';
    document.getElementById('productDetailContainer').style.display = 'block';

    // Populate data
    const imgEl = document.getElementById('detailImage');
    imgEl.src = product.image;
    imgEl.onerror = () => { imgEl.src = 'https://images.unsplash.com/photo-1555529771-835f59bfc50c?auto=format&fit=crop&w=600&q=80'; };
    
    document.getElementById('detailTitle').textContent = product.title;
    document.getElementById('detailPrice').textContent = `$${product.price.toFixed(2)}`;
    document.getElementById('detailCondition').textContent = product.condition || 'Usado';
    document.getElementById('detailCategory').textContent = getCategoryName(product.category);

    // Setup Add to Cart functionality
    const addBtn = document.getElementById('detailAddBtn');
    addBtn.onclick = (e) => {
        window.addToCartGlobal(product);
        
        const originalText = addBtn.textContent;
        addBtn.textContent = "¡Añadido al Carrito!";
        addBtn.style.background = "#10b981"; // success green
        
        setTimeout(() => {
            addBtn.textContent = originalText;
            addBtn.style.background = ""; // remove inline style to fallback to classes
        }, 1500);
    };

    // Populate dynamic specs
    const specsList = document.getElementById('specsList');
    specsList.innerHTML = '';
    
    if (product.specs && product.specs.length > 0) {
        product.specs.forEach(spec => {
            const row = document.createElement('div');
            row.className = 'flex flex-col md:flex-row border-b border-border-subtle hover:bg-surface-container-low transition-colors group';
            row.innerHTML = `
                <div class="md:w-[30%] py-spec-row-padding font-semibold text-slate-deep opacity-80 group-hover:text-indigo-vibrant transition-colors">${spec.name}</div>
                <div class="md:w-[70%] py-spec-row-padding text-slate-deep font-medium">${spec.value}</div>
            `;
            specsList.appendChild(row);
        });
    } else {
        specsList.innerHTML = '<p class="text-slate-deep opacity-70 py-4">No hay especificaciones detalladas para este producto.</p>';
    }
}

function showError() {
    document.getElementById('loadingState').style.display = 'none';
    document.getElementById('productDetailContainer').style.display = 'none';
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
