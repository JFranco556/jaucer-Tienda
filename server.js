require('dotenv').config();
const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Configuración de MongoDB
const uri = process.env.MONGO_URI;
const client = new MongoClient(uri);
let db, productsCollection;

async function connectDB() {
    try {
        await client.connect();
        db = client.db("JaucerDB");
        productsCollection = db.collection("products");
        console.log("Conectado exitosamente a MongoDB");
    } catch (error) {
        console.error("Error conectando a MongoDB:", error);
    }
}
connectDB();

// Middleware de autenticación simple para rutas protegidas
const requireAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader === process.env.ADMIN_PASS) {
        next();
    } else {
        res.status(401).json({ error: 'No autorizado' });
    }
};

// --- RUTAS DE LA API ---

// 1. Obtener todos los productos (Público)
app.get('/api/products', async (req, res) => {
    try {
        const products = await productsCollection.find({}).toArray();
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener productos' });
    }
});

// 1.5 Obtener un producto por ID (Público)
app.get('/api/products/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const product = await productsCollection.findOne({ _id: new ObjectId(id) });
        if (product) {
            res.json(product);
        } else {
            res.status(404).json({ error: 'Producto no encontrado' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener el producto' });
    }
});

// 2. Agregar un nuevo producto (Protegido)
app.post('/api/products', requireAuth, async (req, res) => {
    try {
        const { title, category, price, image, condition } = req.body;
        const newProduct = { title, category, price: Number(price), image, condition, createdAt: new Date() };
        const result = await productsCollection.insertOne(newProduct);
        res.status(201).json({ message: 'Producto agregado', id: result.insertedId });
    } catch (error) {
        res.status(500).json({ error: 'Error al guardar el producto' });
    }
});

// 3. Eliminar un producto (Protegido)
app.delete('/api/products/:id', requireAuth, async (req, res) => {
    try {
        const id = req.params.id;
        const result = await productsCollection.deleteOne({ _id: new ObjectId(id) });
        if (result.deletedCount === 1) {
            res.json({ message: 'Producto eliminado exitosamente' });
        } else {
            res.status(404).json({ error: 'Producto no encontrado' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar el producto' });
    }
});

// 4. Iniciar sesión (Verificar contraseña)
app.post('/api/login', (req, res) => {
    const { password } = req.body;
    if (password === process.env.ADMIN_PASS) {
        res.json({ success: true, token: password }); // Usamos la contraseña como token simple
    } else {
        res.status(401).json({ success: false, error: 'Contraseña incorrecta' });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
