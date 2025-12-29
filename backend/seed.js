const mongoose = require('mongoose');
const Product = require('./models/Product');

// YOUR DATABASE LINK (I added it for you)
const MONGO_URI = "mongodb+srv://instahome2406_db_user:Madinkwm@cluster0.puzhmmu.mongodb.net/?appName=cluster0";

mongoose.connect(MONGO_URI)
    .then(() => console.log("✅ Database Connected. Adding products now..."))
    .catch((err) => console.log(err));

// THE LIST OF PRODUCTS TO ADD
const products = [
    {
        name: "Amul Taaza Milk (500ml)",
        category: "Dairy",
        price: 27,
        image: "https://m.media-amazon.com/images/I/61lzZAg-mzL._SL1500_.jpg",
        isAvailable: true
    },
    {
        name: "Britannia Brown Bread",
        category: "Bakery",
        price: 45,
        image: "https://m.media-amazon.com/images/I/61s+I6X6FCL.jpg",
        isAvailable: true
    },
    {
        name: "Lays India's Magic Masala",
        category: "Snacks",
        price: 20,
        image: "https://m.media-amazon.com/images/I/71IsI+7+s+L._SL1500_.jpg",
        isAvailable: true
    },
    {
        name: "Tata Salt (1kg)",
        category: "Grocery",
        price: 28,
        image: "https://m.media-amazon.com/images/I/61M6lM4qKOL._SL1000_.jpg",
        isAvailable: true
    },
    {
        name: "Coca-Cola (750ml)",
        category: "Drinks",
        price: 40,
        image: "https://m.media-amazon.com/images/I/61q9-v6vjBL._SL1500_.jpg",
        isAvailable: true
    },
    {
        name: "Farm Fresh Eggs (6pcs)",
        category: "Dairy",
        price: 55,
        image: "https://m.media-amazon.com/images/I/41-Wc+4Z+PL.jpg",
        isAvailable: true
    }
];

// THE FUNCTION THAT SENDS DATA
const seedDB = async () => {
    try {
        await Product.deleteMany({}); // Empty the warehouse first
        await Product.insertMany(products); // Put new items in
        console.log("✅ SUCCESS! Added 6 Products to the Store.");
    } catch (e) {
        console.log("Error:", e);
    }
    mongoose.connection.close(); // Drive the truck away
};

seedDB();