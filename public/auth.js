// Manejo de Autenticación de Usuarios

let currentUser = JSON.parse(localStorage.getItem('jaucer_user')) || null;
let currentToken = localStorage.getItem('jaucer_user_token') || null;

window.isAuthenticated = function() {
    return currentToken !== null;
};

window.showAuthModal = function() {
    const modal = document.getElementById('authModal');
    if (modal) {
        modal.classList.add('open');
        document.body.style.overflow = 'hidden';
    }
};

window.hideAuthModal = function() {
    const modal = document.getElementById('authModal');
    if (modal) {
        modal.classList.remove('open');
        document.body.style.overflow = 'auto';
    }
};

window.toggleAuthView = function() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const title = document.getElementById('authTitle');
    const toggleText = document.getElementById('authToggleText');
    
    if (loginForm.style.display === 'none') {
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
        title.textContent = 'Iniciar Sesión';
        toggleText.innerHTML = '¿No tienes cuenta? <a href="#" onclick="toggleAuthView()">Regístrate aquí</a>';
    } else {
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
        title.textContent = 'Crear Cuenta';
        toggleText.innerHTML = '¿Ya tienes cuenta? <a href="#" onclick="toggleAuthView()">Inicia sesión aquí</a>';
    }
};

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const errorMsg = document.getElementById('loginErrorMsg');
    const btn = document.getElementById('loginBtn');
    
    btn.textContent = 'Iniciando...';
    btn.disabled = true;
    errorMsg.style.display = 'none';
    
    try {
        const res = await fetch('/api/user-login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const data = await res.json();
        if (res.ok) {
            loginSuccess(data.token, data.user);
        } else {
            errorMsg.textContent = data.error || 'Error al iniciar sesión';
            errorMsg.style.display = 'block';
        }
    } catch (error) {
        errorMsg.textContent = 'Error de conexión';
        errorMsg.style.display = 'block';
    }
    
    btn.textContent = 'Entrar';
    btn.disabled = false;
}

async function handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('regName').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    const errorMsg = document.getElementById('regErrorMsg');
    const btn = document.getElementById('regBtn');
    
    btn.textContent = 'Creando cuenta...';
    btn.disabled = true;
    errorMsg.style.display = 'none';
    
    try {
        const res = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });
        
        const data = await res.json();
        if (res.ok) {
            loginSuccess(data.token, data.user);
        } else {
            errorMsg.textContent = data.error || 'Error al registrarse';
            errorMsg.style.display = 'block';
        }
    } catch (error) {
        errorMsg.textContent = 'Error de conexión';
        errorMsg.style.display = 'block';
    }
    
    btn.textContent = 'Crear Cuenta';
    btn.disabled = false;
}

async function loginSuccess(token, user) {
    localStorage.setItem('jaucer_user_token', token);
    localStorage.setItem('jaucer_user', JSON.stringify(user));
    currentToken = token;
    currentUser = user;
    
    hideAuthModal();
    updateAuthUI();
    
    // Obtener carrito del servidor
    try {
        const res = await fetch('/api/cart', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            const serverCart = await res.json();
            if (serverCart && serverCart.length > 0) {
                // Fusionar con el carrito local o reemplazar
                if (typeof cart !== 'undefined') {
                    // Para simplificar, reemplazamos el carrito local con el del servidor si existe
                    cart = serverCart;
                    if (typeof saveCart === 'function') {
                        // Guardar sin disparar otro fetch (el fetch ya está en saveCart pero no importa mucho, se sincronizará igual)
                        localStorage.setItem('jaucer_cart', JSON.stringify(cart));
                        if(typeof updateCartIconCount === 'function') updateCartIconCount();
                        if(typeof renderCart === 'function') renderCart();
                    }
                }
            } else {
                // Si el servidor no tiene carrito, le enviamos el local (si tiene)
                if (typeof saveCart === 'function' && cart && cart.length > 0) {
                    saveCart();
                }
            }
        }
    } catch(e) {
        console.error("Error obteniendo carrito:", e);
    }

    // Si se abrio al querer agregar al carrito, podríamos reintentarlo o mostrar mensaje
    alert(`¡Bienvenido/a, ${user.name}! Ya puedes añadir productos a tu carrito.`);
}

window.logoutUser = function() {
    localStorage.removeItem('jaucer_user_token');
    localStorage.removeItem('jaucer_user');
    currentToken = null;
    currentUser = null;
    updateAuthUI();
    
    // Opcional: vaciar carrito local por seguridad
    localStorage.removeItem('jaucer_cart');
    if(typeof renderCart === 'function') {
        cart = []; // Resetear variable de cart.js
        renderCart();
        updateCartIconCount();
    }
    
    alert("Has cerrado sesión.");
};

function updateAuthUI() {
    const authNavLinks = document.querySelectorAll('.auth-nav-link');
    authNavLinks.forEach(link => {
        if (isAuthenticated()) {
            link.innerHTML = `<span>Hola, ${currentUser.name}</span> <a href="#" onclick="logoutUser()" style="margin-left: 10px; color: var(--accent-color); font-size: 0.9em;">(Salir)</a>`;
        } else {
            link.innerHTML = `<a href="#" onclick="showAuthModal()">Iniciar Sesión</a>`;
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    // Inyectar HTML del Modal
    if (!document.getElementById('authModal')) {
        const authHTML = `
            <div id="authModal" class="auth-overlay">
                <div class="auth-box">
                    <button class="close-auth-btn" onclick="hideAuthModal()"><i class="fa-solid fa-xmark"></i></button>
                    <h2 id="authTitle" style="margin-bottom: 20px; font-size: 1.8rem;">Iniciar Sesión</h2>
                    
                    <!-- Login Form -->
                    <form id="loginForm" onsubmit="handleLogin(event)">
                        <div class="form-group" style="margin-bottom: 15px;">
                            <label style="display:block; margin-bottom: 5px; color: var(--text-muted);">Email</label>
                            <input type="email" id="loginEmail" required style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid var(--glass-border); background: var(--bg-color); color: white;">
                        </div>
                        <div class="form-group" style="margin-bottom: 20px;">
                            <label style="display:block; margin-bottom: 5px; color: var(--text-muted);">Contraseña</label>
                            <input type="password" id="loginPassword" required style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid var(--glass-border); background: var(--bg-color); color: white;">
                        </div>
                        <p id="loginErrorMsg" style="color: var(--accent-color); margin-bottom: 10px; display: none;"></p>
                        <button type="submit" id="loginBtn" style="width: 100%; padding: 12px; background: var(--primary-color); color: white; border: none; border-radius: 8px; font-weight: bold; cursor: pointer;">Entrar</button>
                    </form>
                    
                    <!-- Register Form -->
                    <form id="registerForm" onsubmit="handleRegister(event)" style="display: none;">
                        <div class="form-group" style="margin-bottom: 15px;">
                            <label style="display:block; margin-bottom: 5px; color: var(--text-muted);">Nombre Completo</label>
                            <input type="text" id="regName" required style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid var(--glass-border); background: var(--bg-color); color: white;">
                        </div>
                        <div class="form-group" style="margin-bottom: 15px;">
                            <label style="display:block; margin-bottom: 5px; color: var(--text-muted);">Email</label>
                            <input type="email" id="regEmail" required style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid var(--glass-border); background: var(--bg-color); color: white;">
                        </div>
                        <div class="form-group" style="margin-bottom: 20px;">
                            <label style="display:block; margin-bottom: 5px; color: var(--text-muted);">Contraseña</label>
                            <input type="password" id="regPassword" required style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid var(--glass-border); background: var(--bg-color); color: white;">
                        </div>
                        <p id="regErrorMsg" style="color: var(--accent-color); margin-bottom: 10px; display: none;"></p>
                        <button type="submit" id="regBtn" style="width: 100%; padding: 12px; background: var(--primary-color); color: white; border: none; border-radius: 8px; font-weight: bold; cursor: pointer;">Crear Cuenta</button>
                    </form>
                    
                    <p id="authToggleText" style="text-align: center; margin-top: 20px; color: var(--text-muted); font-size: 0.9rem;">
                        ¿No tienes cuenta? <a href="#" onclick="toggleAuthView()" style="color: var(--primary-hover);">Regístrate aquí</a>
                    </p>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', authHTML);
    }
    
    // Actualizar navbars
    updateAuthUI();
});
