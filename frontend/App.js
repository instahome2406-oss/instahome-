import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, FlatList, Image, TouchableOpacity, SafeAreaView, Platform, Modal, TextInput, StatusBar } from 'react-native';
import axios from 'axios';

// ⚠️ WEB MODE (LOCALHOST)
const API_URL = 'http://localhost:5000'; 

export default function App() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [address, setAddress] = useState('');

  // Fetch Products
  useEffect(() => {
    axios.get(`${API_URL}/products`)
      .then(res => setProducts(res.data))
      .catch(err => console.error(err));
  }, []);

  // Add to Cart
  const addToCart = (product) => {
    // Check if already in cart
    const exists = cart.find(item => item._id === product._id);
    if (exists) return; // Stop if already added

    setCart([...cart, product]);
  };

  // Place Order
  const placeOrder = async () => {
    if (cart.length === 0) return alert("Cart is empty");
    if (!customerName || !address) return alert("Please fill details");

    const orderData = {
      customerName,
      address,
      items: cart,
      totalAmount: cart.reduce((sum, item) => sum + item.price, 0),
      status: "Pending"
    };

    try {
      await axios.post(`${API_URL}/place-order`, orderData);
      alert("✅ Order Placed Successfully!");
      setCart([]);
      setModalVisible(false);
      setCustomerName('');
      setAddress('');
    } catch (error) {
  alert("Error Details: " + error.message);
}
  };

  // Render Product Card
  const renderItem = ({ item }) => {
    // Check if this specific item is in the cart
    const isAdded = cart.some(cartItem => cartItem._id === item._id);

    return (
      <View style={styles.card}>
        <Image source={{ uri: item.image }} style={styles.image} />
        <View style={styles.info}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.price}>₹{item.price}</Text>
        </View>
        
        {/* BUTTON CHANGES COLOR WHEN CLICKED */}
        <TouchableOpacity 
            onPress={() => addToCart(item)} 
            style={[styles.addBtn, isAdded ? styles.addedBtn : null]}>
            <Text style={[styles.addText, isAdded ? styles.addedText : null]}>
                {isAdded ? "ADDED ✅" : "ADD"}
            </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>🥦 InstaHome</Text>
        
        {/* Cart Button only appears if items are in cart */}
        {cart.length > 0 && (
          <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.cartBtn}>
            <Text style={styles.cartText}>🛒 View Cart ({cart.length})</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={products}
        keyExtractor={item => item._id}
        renderItem={renderItem}
        contentContainerStyle={{paddingBottom: 50}}
      />

      {/* Cart Popup */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                <Text style={styles.title}>Your Cart 🛒</Text>
                
                <FlatList
                    data={cart}
                    keyExtractor={(item, index) => index.toString()}
                    renderItem={({ item }) => (
                    <View style={styles.cartItem}>
                        <Text>{item.name}</Text>
                        <Text style={{ fontWeight: 'bold' }}>₹{item.price}</Text>
                    </View>
                    )}
                    style={{maxHeight: 200}}
                />

                <View style={styles.form}>
                    <Text style={styles.total}>Total: ₹{cart.reduce((sum, item) => sum + item.price, 0)}</Text>
                    
                    <TextInput placeholder="Your Name" style={styles.input} value={customerName} onChangeText={setCustomerName} />
                    <TextInput placeholder="Delivery Address" style={styles.input} value={address} onChangeText={setAddress} />
                    
                    <TouchableOpacity onPress={placeOrder} style={styles.payBtn}>
                        <Text style={styles.payText}>PLACE ORDER</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                        <Text style={{ color: 'red' }}>Close</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, backgroundColor: 'white', borderBottomWidth: 1, borderColor: '#eee' },
  logo: { fontSize: 22, fontWeight: 'bold', color: '#2c0e3a' },
  cartBtn: { backgroundColor: '#e11d48', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20 },
  cartText: { color: 'white', fontWeight: 'bold', fontSize: 14 },
  
  card: { flexDirection: 'row', backgroundColor: 'white', marginHorizontal: 15, marginVertical: 8, padding: 10, borderRadius: 12, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4 },
  image: { width: 60, height: 60, borderRadius: 8, marginRight: 15, backgroundColor: '#eee' },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  price: { color: 'green', fontWeight: 'bold', marginTop: 4 },
  
  // Button Styles
  addBtn: { borderWidth: 1, borderColor: '#e11d48', paddingHorizontal: 20, paddingVertical: 8, borderRadius: 8, backgroundColor: 'white' },
  addText: { color: '#e11d48', fontWeight: 'bold' },
  
  // Added State Styles
  addedBtn: { backgroundColor: '#10b981', borderColor: '#10b981' }, // Green
  addedText: { color: 'white' },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '90%', backgroundColor: 'white', borderRadius: 20, padding: 20, elevation: 5 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  cartItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderColor: '#eee' },
  form: { marginTop: 20 },
  total: { fontSize: 20, fontWeight: 'bold', textAlign: 'right', marginBottom: 15 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 12, borderRadius: 8, marginBottom: 10 },
  payBtn: { backgroundColor: '#2c0e3a', padding: 15, borderRadius: 10, alignItems: 'center', marginBottom: 10 },
  payText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  closeBtn: { alignItems: 'center', padding: 10 }
});