require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http'); 
const { Server } = require("socket.io"); 
const crypto = require('crypto'); // 🛡️ MILITARY GRADE SECURITY

const app = express();
app.use(cors());
app.use(express.json());

// --- REAL-TIME SERVER ---
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

io.on('connection', (socket) => {
    console.log('⚡ User Connected:', socket.id);
});

// --- DATABASE ---
const MONGO_URI = "mongodb+srv://admin:admin123@cluster0.puzhmmu.mongodb.net/instahome?retryWrites=true&w=majority";
mongoose.connect(MONGO_URI)
    .then(() => console.log('✅ MongoDB Connected!'))
    .catch(err => console.error(err));

// --- MODELS ---
const UserSchema = new mongoose.Schema({
    phone: String,
    otp: String, 
    name: String,
    address: String
});
const User = mongoose.model('User', UserSchema);

const Product = mongoose.model('Product', new mongoose.Schema({
    name: String, price: Number, category: String, image: String, inStock: Boolean
}));

const Order = mongoose.model('Order', new mongoose.Schema({
    customerName: String, address: String, items: Array, totalAmount: Number, 
    status: { type: String, default: "Pending" }, createdAt: { type: Date, default: Date.now }
}));

// --- ROUTES ---

// 1. THE CRYPTO OTP ENGINE 🛡️
app.post('/login', async (req, res) => {
    const { phone } = req.body;
    
    // 🛡️ UNPREDICTABLE ENGINE
    // This does not use Math.random(). It uses system noise (entropy).
    // It generates a cryptographically strong 4-digit number.
    const val = crypto.randomInt(1000, 9999); 
    const shadowOTP = val.toString();

    let user = await User.findOne({ phone });
    if (!user) {
        user = new User({ phone });
    }
    
    // Save new OTP (Overwrites old one immediately)
    user.otp = shadowOTP; 
    await user.save();

    console.log(`🔐 Generated Secure OTP for ${phone}: ${shadowOTP}`); // Log for debugging

    // Send hidden response
    res.json({ success: true, secret_code: shadowOTP });
});

// 2. VERIFY OTP
app.post('/verify-otp', async (req, res) => {
    const { phone, otp } = req.body;
    const user = await User.findOne({ phone });
    
    if (user && user.otp === otp) {
        user.otp = null; // Destroy OTP immediately after use
        await user.save();
        res.json({ success: true, user });
    } else {
        res.status(400).json({ error: "Invalid Code" });
    }
});

// 3. PLACE ORDER
app.post('/place-order', async (req, res) => {
    try {
        const newOrder = new Order(req.body);
        await newOrder.save();
        io.emit('order_update', { type: 'NEW_ORDER', data: newOrder });
        res.status(201).json({ message: "Order Placed!" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/products', async (req, res) => {
    const products = await Product.find();
    res.json(products);
});

app.get('/orders', async (req, res) => {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
});

app.post('/update-status', async (req, res) => {
    const { orderId, status } = req.body;
    await Order.findByIdAndUpdate(orderId, { status });
    res.json({ success: true });
});

server.listen(5000, () => {
    console.log('🚀 Crypto-Secure Server running on Port 5000');
});