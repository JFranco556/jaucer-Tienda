let adminToken = sessionStorage.getItem('jaucer_admin_token');

if (!adminToken) {
    window.location.href = 'admin.html';
} else {
    loadSales();
}

function logout() {
    sessionStorage.removeItem('jaucer_admin_token');
    window.location.href = 'admin.html';
}

async function loadSales() {
    const salesList = document.getElementById('salesList');
    try {
        const res = await fetch('/api/sales', {
            headers: { 'Authorization': adminToken }
        });
        
        if (!res.ok) {
            salesList.innerHTML = '<tr><td colspan="5" style="text-align:center; color:var(--accent-color);">No autorizado o error al cargar.</td></tr>';
            return;
        }
        
        const sales = await res.json();
        salesList.innerHTML = '';
        
        if (sales.length === 0) {
            salesList.innerHTML = '<tr><td colspan="5" style="text-align:center;">No hay ventas registradas aún.</td></tr>';
            return;
        }
        
        sales.forEach(sale => {
            const tr = document.createElement('tr');
            const dateStr = sale.soldAt ? new Date(sale.soldAt).toLocaleString() : 'Fecha desconocida';
            tr.innerHTML = `
                <td>${dateStr}</td>
                <td><img src="${sale.image}" class="small-img" onerror="this.src='https://images.unsplash.com/photo-1555529771-835f59bfc50c?auto=format&fit=crop&w=600&q=80';"></td>
                <td>${sale.title}</td>
                <td>S/. ${sale.price.toFixed(2)}</td>
                <td>${sale.category}</td>
            `;
            salesList.appendChild(tr);
        });
    } catch (error) {
        console.error(error);
        salesList.innerHTML = '<tr><td colspan="5" style="text-align:center; color:var(--accent-color);">Error de red al cargar ventas.</td></tr>';
    }
}
