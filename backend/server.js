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

// ⚠️ YOUR REAL DATABASE
const MONGO_URI = "mongodb+srv://instahome2406_db_user:Madinkwm@cluster0.puzhmmu.mongodb.net/instahome?retryWrites=true&w=majority&appName=Cluster0";

mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 5000 })
    .then(() => console.log('✅ PRO DB Connected!'))
    .catch(err => console.error(err));

// --- PRODUCTION MODELS ---
const User = mongoose.model('User', new mongoose.Schema({
    phone: String,
    deviceId: String, 
    otp: String, 
    joinedAt: { type: Date, default: Date.now }
}));

const Product = mongoose.model('Product', new mongoose.Schema({
    name: String, price: Number, category: String, image: String,
    qty: String // e.g., "500g", "1 L"
}));

const Order = mongoose.model('Order', new mongoose.Schema({
    customerName: String, address: String, phone: String,
    items: Array, totalAmount: Number, paymentMode: String,
    status: { type: String, default: "Placed" }, 
    createdAt: { type: Date, default: Date.now }
}));

// --- ROUTES ---

// 1. SECURE LOGIN (Device Lock)
app.post('/login', async (req, res) => {
    try {
        const { phone, deviceId } = req.body;
        const shadowOTP = crypto.randomInt(1000, 9999).toString();

        let user = await User.findOne({ phone });
        if (!user) {
            user = new User({ phone, deviceId }); // Register & Lock
        } else {
            // Check Lock (Allow re-login if same device, block if different)
            if (user.deviceId && user.deviceId !== deviceId) {
                return res.status(403).json({ error: "Number registered on another phone." });
            }
            if (!user.deviceId) user.deviceId = deviceId;
        }
        user.otp = shadowOTP;
        await user.save();
        res.json({ success: true, secret_code: shadowOTP });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/verify-otp', async (req, res) => {
    const { phone, otp } = req.body;
    const user = await User.findOne({ phone });
    if (user && user.otp === otp) {
        user.otp = null; await user.save();
        res.json({ success: true, user });
    } else { res.status(400).json({ error: "Invalid Code" }); }
});

// 2. ORDER SYSTEM
app.post('/place-order', async (req, res) => {
    try {
        const newOrder = new Order(req.body);
        await newOrder.save();
        io.emit('order_update', { type: 'NEW_ORDER', data: newOrder });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/products', async (req, res) => { const p = await Product.find(); res.json(p); });
app.get('/orders', async (req, res) => { const o = await Order.find().sort({ createdAt: -1 }); res.json(o); });

// 3. ADMIN TOOLS
app.get('/reset-all', async (req, res) => {
    await User.deleteMany({});
    await Order.deleteMany({});
    res.send("✅ System Reset: Users & Orders Cleared.");
});

app.get('/seed-pro', async (req, res) => {
    await Product.deleteMany({});
    const proProducts = [
        { name: "Amul Taaza Milk", price: 28, qty: "500 ml", category: "Dairy", image: "https://www.bigbasket.com/media/uploads/p/l/306926-2_4-amul-homogenised-toned-milk.jpg" },
        { name: "Britannia Bread", price: 45, qty: "400 g", category: "Bakery", image: "https://www.bigbasket.com/media/uploads/p/l/40003150_3-britannia-bread-whole-wheat.jpg" },
        { name: "Farm Eggs", price: 85, qty: "12 pcs", category: "Dairy", image: "https://www.bigbasket.com/media/uploads/p/l/150502_6-fresho-farm-eggs-table-tray.jpg" },
        { name: "Coca Cola", price: 40, qty: "750 ml", category: "Drinks", image: "https://www.bigbasket.com/media/uploads/p/l/251006_11-thums-up-soft-drink.jpg" },
        { name: "Lays Chips", price: 20, qty: "Standard", category: "Snacks", image: "https://www.bigbasket.com/media/uploads/p/l/102555_9-lays-potato-chips-indias-magic-masala.jpg" },
        { name: "Onion (Pyaz)", price: 35, qty: "1 kg", category: "Veg", image: "https://www.bigbasket.com/media/uploads/p/l/10000148_30-fresho-onion.jpg" },
        { name: "Tomato (Local)", price: 40, qty: "1 kg", category: "Veg", image: "https://www.bigbasket.com/media/uploads/p/l/10000200_17-fresho-tomato-local.jpg" }
    ];
    await Product.insertMany(proProducts);
    res.send("✅ PRO Products Added!");
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 WAR MODE SERVER: Port ${PORT}`));
