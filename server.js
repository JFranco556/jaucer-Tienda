require('dotenv').config();
const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Configuración de MongoDB
const uri = process.env.MONGO_URI;
const client = new MongoClient(uri);
let db, productsCollection, usersCollection, salesCollection;

async function connectDB() {
    try {
        await client.connect();
        db = client.db("JaucerDB");
        productsCollection = db.collection("products");
        usersCollection = db.collection("users");
        salesCollection = db.collection("sales");
        console.log("Conectado exitosamente a MongoDB");
    } catch (error) {
        console.error("Error conectando a MongoDB:", error);
    }
}
connectDB();

// Middleware de autenticación simple para rutas protegidas (Admin)
const requireAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader === process.env.ADMIN_PASS) {
        next();
    } else {
        res.status(401).json({ error: 'No autorizado' });
    }
};

// Middleware para verificar token de usuario regular
const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader) {
        const token = authHeader.replace('Bearer ', '');
        jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
            if (err) return res.status(403).json({ error: 'Token inválido' });
            req.user = user;
            next();
        });
    } else {
        res.status(401).json({ error: 'No autenticado' });
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
        const { title, category, price, image, condition, specs, stock } = req.body;
        const newProduct = { title, category, price: Number(price), image, condition, specs: specs || [], stock: Number(stock) || 1, createdAt: new Date() };
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

// 4. Iniciar sesión admin (Verificar contraseña)
app.post('/api/login', (req, res) => {
    const { password } = req.body;
    if (password === process.env.ADMIN_PASS) {
        res.json({ success: true, token: password }); // Usamos la contraseña como token simple
    } else {
        res.status(401).json({ success: false, error: 'Contraseña incorrecta' });
    }
});

// 5. Registro de usuario regular
app.post('/api/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        
        // Check if user exists
        const existingUser = await usersCollection.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'El email ya está registrado' });
        }
        
        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        // Create user
        const newUser = {
            name,
            email,
            password: hashedPassword,
            createdAt: new Date()
        };
        
        const result = await usersCollection.insertOne(newUser);
        
        // Create JWT token
        const token = jwt.sign({ id: result.insertedId, email }, process.env.JWT_SECRET, { expiresIn: '7d' });
        
        res.status(201).json({ message: 'Usuario creado', token, user: { name, email } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al registrar usuario' });
    }
});

// 6. Login de usuario regular
app.post('/api/user-login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Find user
        const user = await usersCollection.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: 'Credenciales inválidas' });
        }
        
        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Credenciales inválidas' });
        }
        
        // Create JWT token
        const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
        
        res.json({ message: 'Inicio de sesión exitoso', token, user: { name: user.name, email: user.email } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al iniciar sesión' });
    }
});

// 7. Reservar producto (Usuario Regular)
app.post('/api/products/:id/reserve', verifyToken, async (req, res) => {
    try {
        const id = req.params.id;
        const qty = Number(req.body.quantity) || 1;
        
        const result = await productsCollection.findOneAndUpdate(
            { _id: new ObjectId(id), stock: { $gte: qty } },
            { $inc: { stock: -qty } },
            { returnDocument: 'after' }
        );
        
        if (result) {
            res.json({ message: 'Producto reservado exitosamente', stock: result.stock });
        } else {
            res.status(400).json({ error: 'No hay stock suficiente para separar este producto' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al reservar producto' });
    }
});

// 8. Liberar producto (Usuario Regular)
app.post('/api/products/:id/release', verifyToken, async (req, res) => {
    try {
        const id = req.params.id;
        const qty = Number(req.body.quantity) || 1;
        
        await productsCollection.findOneAndUpdate(
            { _id: new ObjectId(id) },
            { $inc: { stock: qty } }
        );
        
        res.json({ message: 'Producto liberado' });
    } catch (error) {
        res.status(500).json({ error: 'Error al liberar producto' });
    }
});

// 9. Marcar producto como vendido (Admin)
app.post('/api/products/:id/sell', requireAuth, async (req, res) => {
    try {
        const id = req.params.id;
        const product = await productsCollection.findOne({ _id: new ObjectId(id) });
        
        if (!product) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }
        
        // Registrar en ventas
        const saleRecord = {
            ...product,
            _id: new ObjectId(), // nuevo ID de venta
            originalProductId: product._id,
            soldAt: new Date()
        };
        await salesCollection.insertOne(saleRecord);
        
        // Eliminar del catálogo principal
        await productsCollection.deleteOne({ _id: new ObjectId(id) });
        
        res.json({ message: 'Producto marcado como vendido y registrado en historial' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al procesar la venta' });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
