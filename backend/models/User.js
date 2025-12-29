const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    phone: { type: String, required: true, unique: true },
    otp: { type: String }, // Stores the temporary code
    name: { type: String, default: "Customer" },
    address: { type: String, default: "" }
});

module.exports = mongoose.model('User', userSchema);