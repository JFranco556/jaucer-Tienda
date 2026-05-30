// Lógica del Panel de Administrador
let adminToken = localStorage.getItem('jaucer_admin_token');

const loginScreen = document.getElementById('loginScreen');
const adminDashboard = document.getElementById('adminDashboard');
const loginError = document.getElementById('loginError');
const adminProductsList = document.getElementById('adminProductsList');

// Revisar si ya está logueado
if (adminToken) {
    showDashboard();
}

async function login() {
    const password = document.getElementById('adminPassword').value;
    
    try {
        const res = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password })
        });
        
        const data = await res.json();
        if (data.success) {
            adminToken = data.token;
            localStorage.setItem('jaucer_admin_token', adminToken);
            showDashboard();
        } else {
            loginError.style.display = 'block';
        }
    } catch (error) {
        alert("Error de conexión");
    }
}

function logout() {
    localStorage.removeItem('jaucer_admin_token');
    adminToken = null;
    document.getElementById('adminPassword').value = '';
    loginError.style.display = 'none';
    adminDashboard.style.display = 'none';
    loginScreen.style.display = 'block';
}

function showDashboard() {
    loginScreen.style.display = 'none';
    adminDashboard.style.display = 'block';
    loadAdminProducts();
}

async function loadAdminProducts() {
    try {
        const res = await fetch('/api/products');
        const products = await res.json();
        
        adminProductsList.innerHTML = '';
        products.forEach(p => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><img src="${p.image}" class="small-img" onerror="this.src='https://images.unsplash.com/photo-1555529771-835f59bfc50c?auto=format&fit=crop&w=600&q=80';"></td>
                <td>${p.title}</td>
                <td>$${p.price.toFixed(2)}</td>
                <td>${p.category}</td>
                <td>
                    <button class="btn btn-danger" onclick="deleteProduct('${p._id}')"><i class="fa-solid fa-trash"></i></button>
                </td>
            `;
            adminProductsList.appendChild(tr);
        });
    } catch (error) {
        console.error("Error al cargar productos:", error);
        if (adminToken) logout(); // Si falla, puede que haya expirado la sesión
    }
}

async function addProduct(event) {
    event.preventDefault();
    const btn = document.getElementById('addBtn');
    btn.textContent = "Guardando...";
    btn.disabled = true;
    
    const newProduct = {
        title: document.getElementById('pTitle').value,
        price: document.getElementById('pPrice').value,
        category: document.getElementById('pCategory').value,
        condition: document.getElementById('pCondition').value,
        image: document.getElementById('pImage').value
    };
    
    try {
        const res = await fetch('/api/products', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': adminToken
            },
            body: JSON.stringify(newProduct)
        });
        
        if (res.ok) {
            document.getElementById('addProductForm').reset();
            loadAdminProducts();
        } else {
            alert("No autorizado o error del servidor.");
        }
    } catch (error) {
        alert("Error de red");
    }
    
    btn.textContent = "Guardar Producto";
    btn.disabled = false;
}

async function deleteProduct(id) {
    if (!confirm('¿Estás seguro de que quieres eliminar este producto?')) return;
    
    try {
        const res = await fetch(`/api/products/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': adminToken }
        });
        
        if (res.ok) {
            loadAdminProducts();
        } else {
            alert("No autorizado o error del servidor.");
        }
    } catch (error) {
        alert("Error de red");
    }
}
