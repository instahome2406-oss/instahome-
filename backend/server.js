require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http'); 
const { Server } = require("socket.io"); 
const crypto = require('crypto');

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// ⚠️ YOUR DB
const MONGO_URI = "mongodb+srv://instahome2406_db_user:Madinkwm@cluster0.puzhmmu.mongodb.net/instahome?retryWrites=true&w=majority&appName=Cluster0";

mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 5000 })
    .then(() => console.log('✅ DB Connected!'))
    .catch(err => console.error(err));

// --- MODELS ---
const User = mongoose.model('User', new mongoose.Schema({
    phone: String,
    verificationCode: String,
    isVerified: { type: Boolean, default: false },
    name: String, address: String
}));

const Product = mongoose.model('Product', new mongoose.Schema({
    name: String, price: Number, category: String, image: String, qty: String
}));

const Order = mongoose.model('Order', new mongoose.Schema({
    customerName: String, address: String, items: Array, totalAmount: Number, 
    status: { type: String, default: "Pending" }, createdAt: { type: Date, default: Date.now }
}));

// --- WHATSAPP AUTH ROUTES ---

// 1. START LOGIN (Generate Code)
app.post('/login-init', async (req, res) => {
    const { phone } = req.body;
    
    // Generate unique 6-digit Reference Code
    const code = "REF-" + crypto.randomInt(100000, 999999).toString();

    let user = await User.findOne({ phone });
    if (!user) user = new User({ phone });
    
    user.verificationCode = code;
    user.isVerified = false;
    await user.save();

    res.json({ 
        success: true, 
        code: code, 
        targetNumber: "919972869722" // ⚠️ YOUR PHONE NUMBER (No +)
    });
});

// 2. BOT VERIFICATION (Your Phone calls this)
app.post('/bot-verify', async (req, res) => {
    const { message, sender } = req.body;
    console.log(`🤖 Bot Msg: ${message}`);

    // Find the user who has this code waiting
    const user = await User.findOne({ verificationCode: { $ne: null } }); 

    // Simple check: Does the message contain the code?
    if (user && message.includes(user.verificationCode)) {
        user.isVerified = true;
        user.verificationCode = null;
        await user.save();
        
        // ALERT THE APP TO LOG IN
        io.emit('login_success', { phone: user.phone });
        
        res.json({ success: true });
    } else {
        res.status(400).json({ error: "Invalid Code" });
    }
});

// 3. CHECK STATUS (Backup polling)
app.post('/check-status', async (req, res) => {
    const { phone } = req.body;
    const user = await User.findOne({ phone });
    if (user && user.isVerified) res.json({ success: true, user });
    else res.json({ success: false });
});

// SHOP ROUTES
app.post('/place-order', async (req, res) => {
    const newOrder = new Order(req.body); await newOrder.save();
    io.emit('order_update', { type: 'NEW_ORDER', data: newOrder });
    res.json({ message: "Order Placed!" });
});
app.get('/products', async (req, res) => { const p = await Product.find(); res.json(p); });
app.get('/orders', async (req, res) => { const o = await Order.find().sort({ createdAt: -1 }); res.json(o); });
app.get('/seed-pro', async (req, res) => { res.send("OK"); });

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 WhatsApp Engine on Port ${PORT}`));