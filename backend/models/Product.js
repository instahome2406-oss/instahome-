const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    category: { type: String, required: true }, // e.g., "Dairy", "Snacks"
    price: { type: Number, required: true },
    image: { type: String, required: true }, // We will use image links
    isAvailable: { type: Boolean, default: true }
});

module.exports = mongoose.model('Product', productSchema);