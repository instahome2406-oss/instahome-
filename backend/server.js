require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http'); 
const { Server } = require("socket.io"); 
const crypto = require('crypto');

const app = express();
app.use(cors());
app.use(express.json());

// --- REAL-TIME SERVER ---
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

io.on('connection', (socket) => {
    console.log('⚡ User Connected:', socket.id);
});

// --- DATABASE CONNECTION (YOUR REAL CREDENTIALS) ---
const MONGO_URI = "mongodb+srv://instahome2406_db_user:Madinkwm@cluster0.puzhmmu.mongodb.net/instahome?retryWrites=true&w=majority&appName=Cluster0";

const connectDB = async () => {
    try {
        await mongoose.connect(MONGO_URI, {
            serverSelectionTimeoutMS: 5000, 
            socketTimeoutMS: 45000,
        });
        console.log('✅ MongoDB Connected Successfully!');
    } catch (err) {
        console.error('❌ DB Connection Error:', err.message);
    }
};
connectDB();

// --- MODELS ---
const User = mongoose.model('User', new mongoose.Schema({
    phone: String, otp: String, name: String, address: String
}));

const Product = mongoose.model('Product', new mongoose.Schema({
    name: String, price: Number, category: String, image: String, inStock: Boolean
}));

const Order = mongoose.model('Order', new mongoose.Schema({
    customerName: String, address: String, items: Array, totalAmount: Number, 
    status: { type: String, default: "Pending" }, createdAt: { type: Date, default: Date.now }
}));

// --- ROUTES ---

// 1. CRYPTO OTP LOGIN
app.post('/login', async (req, res) => {
    const { phone } = req.body;
    
    // Military-Grade Random Number
    const val = crypto.randomInt(1000, 9999); 
    const shadowOTP = val.toString();

    let user = await User.findOne({ phone });
    if (!user) { user = new User({ phone }); }
    
    user.otp = shadowOTP; 
    await user.save();

    console.log(`🔐 OTP for ${phone}: ${shadowOTP}`);
    res.json({ success: true, secret_code: shadowOTP });
});

// 2. VERIFY OTP
app.post('/verify-otp', async (req, res) => {
    const { phone, otp } = req.body;
    const user = await User.findOne({ phone });
    
    if (user && user.otp === otp) {
        user.otp = null; 
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

// 4. GET PRODUCTS
app.get('/products', async (req, res) => {
    const products = await Product.find();
    res.json(products);
});

// 5. GET ORDERS
app.get('/orders', async (req, res) => {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
});

// 6. UPDATE STATUS
app.post('/update-status', async (req, res) => {
    const { orderId, status } = req.body;
    await Order.findByIdAndUpdate(orderId, { status });
    io.emit('order_update', { type: 'STATUS_UPDATE', data: { _id: orderId, status } });
    res.json({ success: true });
});

// START SERVER
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`🚀 Server running on Port ${PORT}`);
});