require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http'); 
const { Server } = require("socket.io"); 
const crypto = require('crypto');

const app = express();

// --- ☢️ NUCLEAR CORS FIX (ALLOW ALL) ---
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*"); // Allow Vercel, Localhost, Phone
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200); // Stop the browser from complaining
    }
    next();
});

app.use(cors()); // Backup
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// DB CONNECTION
const MONGO_URI = "mongodb+srv://instahome2406_db_user:Madinkwm@cluster0.puzhmmu.mongodb.net/instahome?retryWrites=true&w=majority&appName=Cluster0";

mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 5000 })
    .then(() => console.log('✅ DB Connected!'))
    .catch(err => console.error(err));

// --- MODELS ---
const User = mongoose.model('User', new mongoose.Schema({
    phone: String, deviceId: String, otp: String, name: String, address: String
}));
const Product = mongoose.model('Product', new mongoose.Schema({ name: String, price: Number, category: String, image: String }));
const Order = mongoose.model('Order', new mongoose.Schema({ 
    customerName: String, address: String, items: Array, totalAmount: Number, phone: String,
    status: { type: String, default: "Pending" }, createdAt: { type: Date, default: Date.now } 
}));

// --- ROUTES ---
app.post('/update-status', async (req, res) => {
    try {
        const { orderId, status } = req.body;
        await Order.findByIdAndUpdate(orderId, { status });
        res.json({ success: true });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message });
    }
});

app.post('/login', async (req, res) => {
    const { phone } = req.body;
    const otp = "1234"; // Simplified for stability
    let user = await User.findOne({ phone });
    if (!user) user = new User({ phone });
    user.otp = otp; await user.save();
    res.json({ success: true, secret_code: otp });
});

app.post('/verify-otp', async (req, res) => {
    res.json({ success: true, user: { phone: req.body.phone } });
});

app.post('/place-order', async (req, res) => {
    const newOrder = new Order(req.body); await newOrder.save();
    res.json({ message: "Order Placed!" });
});

app.get('/products', async (req, res) => { const p = await Product.find(); res.json(p); });
app.get('/orders', async (req, res) => { const o = await Order.find().sort({ createdAt: -1 }); res.json(o); });
app.get('/seed-pro', async (req, res) => { res.send("OK"); });

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Unblocked Server on Port ${PORT}`));