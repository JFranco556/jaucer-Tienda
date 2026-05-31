// Lógica global del Carrito de Compras
let cart = JSON.parse(localStorage.getItem('jaucer_cart')) || [];

function saveCart() {
    localStorage.setItem('jaucer_cart', JSON.stringify(cart));
    updateCartIconCount();
    renderCart();
}

function updateCartIconCount() {
    const counts = document.querySelectorAll('.cart-count');
    const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
    counts.forEach(c => c.textContent = totalItems);
}

// Expone addToCartGlobal para que app.js y product.js lo llamen
window.addToCartGlobal = function (product) {
    if (typeof isAuthenticated === 'function' && !isAuthenticated()) {
        showAuthModal();
        return;
    }

    const existing = cart.find(item => item._id === product._id);
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({ ...product, quantity: 1 });
    }
    saveCart();

    // Animar ícono
    const cartIcons = document.querySelectorAll('.cart-icon');
    cartIcons.forEach(icon => {
        icon.style.transform = "scale(1.3)";
        setTimeout(() => icon.style.transform = "scale(1)", 300);
    });
};

window.removeFromCart = function (productId) {
    cart = cart.filter(item => item._id !== productId);
    saveCart();
};

window.updateQuantity = function (productId, action) {
    const item = cart.find(i => i._id === productId);
    if (item) {
        if (action === 'increase') {
            item.quantity += 1;
        } else if (action === 'decrease') {
            item.quantity -= 1;
            if (item.quantity <= 0) {
                cart = cart.filter(i => i._id !== productId);
            }
        }
        saveCart();
    }
};

window.toggleCart = function () {
    const panel = document.getElementById('cartPanel');
    const overlay = document.getElementById('cartOverlay');
    if (panel.classList.contains('open')) {
        panel.classList.remove('open');
        overlay.classList.remove('open');
        document.body.style.overflow = 'auto'; // Restaurar scroll
    } else {
        panel.classList.add('open');
        overlay.classList.add('open');
        document.body.style.overflow = 'hidden'; // Evitar scroll de fondo
    }
};

window.checkout = function () {
    if (cart.length === 0) return;

    // Número de WhatsApp del vendedor (Ajusta este número)
    const phoneNumber = "942889318";

    let message = `¡Hola! Quiero realizar el siguiente pedido:\n\n`;
    let total = 0;

    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        message += `- ${item.quantity}x ${item.title} ($${item.price.toFixed(2)} c/u)\n`;
    });

    message += `\n*Total a pagar: $${total.toFixed(2)}*\n\n`;

    if (typeof currentUser !== 'undefined' && currentUser) {
        message += `Mis datos:\nNombre: ${currentUser.name}\nEmail: ${currentUser.email}`;
    }

    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

    // Abrir WhatsApp
    window.open(whatsappUrl, '_blank');

    // Vaciar carrito
    cart = [];
    saveCart();
    toggleCart();
};

function renderCart() {
    const container = document.getElementById('cartItemsContainer');
    const totalEl = document.getElementById('cartTotalAmount');

    if (!container) return; // Si no hay contenedor (e.g., en panel admin), ignorar

    container.innerHTML = '';

    if (cart.length === 0) {
        container.innerHTML = '<div class="empty-cart"><p>Tu carrito está vacío.</p></div>';
        totalEl.textContent = '$0.00';
        return;
    }

    let total = 0;
    cart.forEach(item => {
        total += item.price * item.quantity;
        const itemEl = document.createElement('div');
        itemEl.className = 'cart-item';
        itemEl.innerHTML = `
            <img src="${item.image}" alt="${item.title}" onerror="this.src='https://images.unsplash.com/photo-1555529771-835f59bfc50c?auto=format&fit=crop&w=600&q=80';">
            <div class="cart-item-details">
                <h4>${item.title}</h4>
                <p class="cart-item-price">$${item.price.toFixed(2)}</p>
                <div class="cart-item-actions">
                    <button onclick="updateQuantity('${item._id}', 'decrease')">-</button>
                    <span>${item.quantity}</span>
                    <button onclick="updateQuantity('${item._id}', 'increase')">+</button>
                </div>
            </div>
            <button class="cart-item-remove" onclick="removeFromCart('${item._id}')"><i class="fa-solid fa-trash"></i></button>
        `;
        container.appendChild(itemEl);
    });

    totalEl.textContent = `$${total.toFixed(2)}`;
}

// Inicializar al cargar el DOM
document.addEventListener('DOMContentLoaded', () => {
    // Si no está el HTML del carrito, inyectarlo (útil para no repetir en cada archivo HTML)
    if (!document.getElementById('cartPanel')) {
        const cartHTML = `
            <div id="cartOverlay" class="cart-overlay" onclick="toggleCart()"></div>
            <div id="cartPanel" class="cart-panel">
                <div class="cart-header">
                    <h2>Tu Carrito</h2>
                    <button class="close-cart-btn" onclick="toggleCart()"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <div id="cartItemsContainer" class="cart-items">
                    <!-- Los items se renderizan aquí -->
                </div>
                <div class="cart-footer">
                    <div class="cart-total">
                        <span>Total:</span>
                        <span id="cartTotalAmount">$0.00</span>
                    </div>
                    <button class="checkout-btn" onclick="checkout()">Finalizar Compra</button>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', cartHTML);
    }

    updateCartIconCount();
    renderCart();

    // Asociar toggleCart a todos los íconos de carrito
    const cartIcons = document.querySelectorAll('.cart-icon');
    cartIcons.forEach(icon => {
        icon.style.cursor = 'pointer';
        // Quitar eventos previos si los hubiera y poner el nuevo
        const newIcon = icon.cloneNode(true);
        icon.parentNode.replaceChild(newIcon, icon);
        newIcon.addEventListener('click', toggleCart);
    });
});
