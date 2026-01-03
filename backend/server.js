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

// --- DATABASE CONNECTION (With Auto-Retry) ---
const MONGO_URI = "mongodb+srv://instahome2406_db_user:Madinkwm@cluster0.puzhmmu.mongodb.net/instahome?retryWrites=true&w=majority&appName=Cluster0";

const connectDB = async () => {
    try {
        await mongoose.connect(MONGO_URI, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        console.log('✅ MongoDB Connected Successfully!');
    } catch (err) {
        console.error('❌ DB Error:', err.message);
    }
};
connectDB();

// --- MODELS ---
const User = mongoose.model('User', new mongoose.Schema({
    phone: String,
    deviceId: String, // 🔐 Device Lock
    otp: String, 
    name: String, address: String
}));

const Product = mongoose.model('Product', new mongoose.Schema({ name: String, price: Number, category: String, image: String, inStock: Boolean }));
const Order = mongoose.model('Order', new mongoose.Schema({ customerName: String, address: String, items: Array, totalAmount: Number, status: { type: String, default: "Pending" }, createdAt: { type: Date, default: Date.now } }));

// --- ROUTES ---

// 1. ROBUST LOGIN (With Error Catching)
app.post('/login', async (req, res) => {
    try {
        const { phone, deviceId } = req.body;
        
        // Crypto OTP
        const val = crypto.randomInt(1000, 9999); 
        const shadowOTP = val.toString();

        let user = await User.findOne({ phone });

        if (!user) {
            // New User: Lock to device
            user = new User({ phone, deviceId });
        } else {
            // Existing User: Check Lock
            if (user.deviceId && user.deviceId !== deviceId) {
                return res.status(403).json({ error: "Security Alert: Device Mismatch" });
            }
            // If unlocked, lock it now
            if (!user.deviceId && deviceId) user.deviceId = deviceId;
        }
        
        user.otp = shadowOTP; 
        await user.save();

        res.json({ success: true, secret_code: shadowOTP });
    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

app.post('/verify-otp', async (req, res) => {
    try {
        const { phone, otp } = req.body;
        const user = await User.findOne({ phone });
        
        if (user && user.otp === otp) {
            user.otp = null; 
            await user.save();
            res.json({ success: true, user });
        } else {
            res.status(400).json({ error: "Invalid Code" });
        }
    } catch (e) { res.status(500).json({error: e.message}); }
});

app.post('/place-order', async (req, res) => {
    try {
        const newOrder = new Order(req.body);
        await newOrder.save();
        io.emit('order_update', { type: 'NEW_ORDER', data: newOrder });
        res.json({ message: "Order Placed!" });
    } catch (e) { res.status(500).json({error: e.message}); }
});

app.get('/products', async (req, res) => { 
    try { const p = await Product.find(); res.json(p); } 
    catch(e) { res.json([]); } 
});

app.get('/orders', async (req, res) => { 
    try { const o = await Order.find().sort({ createdAt: -1 }); res.json(o); } 
    catch(e) { res.json([]); } 
});

// START SERVER (Flexible Port)
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`🚀 Server running on Port ${PORT}`);
});