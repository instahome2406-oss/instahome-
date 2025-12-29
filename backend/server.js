require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

// ✅ UPDATED WITH YOUR SCREENSHOT CREDENTIALS
const MONGO_URI = "mongodb+srv://instahome2406_db_user:Madinkwm@cluster0.puzhmmu.mongodb.net/instahome?retryWrites=true&w=majority";

mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected!'))
  .catch(err => console.error('DB Error:', err));

const ProductSchema = new mongoose.Schema({
    name: String,
    price: Number,
    category: String,
    image: String,
    inStock: Boolean
});
const Product = mongoose.model('Product', ProductSchema);

const OrderSchema = new mongoose.Schema({
    customerName: String,
    address: String,
    items: Array,
    totalAmount: Number,
    status: { type: String, default: "Pending" },
    createdAt: { type: Date, default: Date.now }
});
const Order = mongoose.model('Order', OrderSchema);

// ROUTES
app.get('/products', async (req, res) => {
    const products = await Product.find();
    res.json(products);
});

app.post('/place-order', async (req, res) => {
    try {
        const newOrder = new Order(req.body);
        await newOrder.save();
        res.status(201).json({ message: "Order Placed!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
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

app.listen(5000, () => {
    console.log('🚀 Server started on Port 5000');
});