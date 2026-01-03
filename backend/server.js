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

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// YOUR DATABASE
const MONGO_URI = "mongodb+srv://instahome2406_db_user:Madinkwm@cluster0.puzhmmu.mongodb.net/instahome?retryWrites=true&w=majority&appName=Cluster0";

const connectDB = async () => {
    try { await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 5000 }); console.log('✅ DB Connected!'); } 
    catch (err) { console.error('DB Error', err); }
};
connectDB();

// --- UPDATED USER MODEL (With Device Lock) ---
const User = mongoose.model('User', new mongoose.Schema({
    phone: String,
    deviceId: String, // 🔐 This is the Lock
    otp: String, 
    name: String, address: String
}));

const Product = mongoose.model('Product', new mongoose.Schema({ name: String, price: Number, category: String, image: String, inStock: Boolean }));
const Order = mongoose.model('Order', new mongoose.Schema({ customerName: String, address: String, items: Array, totalAmount: Number, status: { type: String, default: "Pending" }, createdAt: { type: Date, default: Date.now } }));

// --- ROUTES ---

// 1. DEVICE LOCKED LOGIN
app.post('/login', async (req, res) => {
    const { phone, deviceId } = req.body;
    
    // Crypto OTP
    const val = crypto.randomInt(1000, 9999); 
    const shadowOTP = val.toString();

    let user = await User.findOne({ phone });

    if (!user) {
        // NEW USER: Create account and LOCK it to this device
        user = new User({ phone, deviceId });
        console.log(`🔒 New User ${phone} locked to device ${deviceId}`);
    } else {
        // EXISTING USER: Check if the device matches!
        if (user.deviceId && user.deviceId !== deviceId) {
            console.log(`⛔ SECURITY ALERT: Login attempt for ${phone} from WRONG device.`);
            // REJECT THE LOGIN
            return res.status(403).json({ success: false, error: "This number is registered on a different phone." });
        }
        
        // If device matches (or wasn't set), update it and proceed
        user.deviceId = deviceId;
    }
    
    // Save OTP
    user.otp = shadowOTP; 
    await user.save();

    // Send code
    res.json({ success: true, secret_code: shadowOTP });
});

app.post('/verify-otp', async (req, res) => {
    const { phone, otp } = req.body;
    const user = await User.findOne({ phone });
    if (user && user.otp === otp) {
        user.otp = null; 
        await user.save();
        res.json({ success: true, user });
    } else { res.status(400).json({ error: "Invalid Code" }); }
});

app.post('/place-order', async (req, res) => {
    const newOrder = new Order(req.body); await newOrder.save();
    io.emit('order_update', { type: 'NEW_ORDER', data: newOrder });
    res.json({ message: "Order Placed!" });
});
app.get('/products', async (req, res) => { const p = await Product.find(); res.json(p); });
app.get('/orders', async (req, res) => { const o = await Order.find().sort({ createdAt: -1 }); res.json(o); });

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Security Server on Port ${PORT}`));