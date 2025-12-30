import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, FlatList, Image, TouchableOpacity, SafeAreaView, Platform, Modal, TextInput, StatusBar, Alert, ActivityIndicator } from 'react-native';
import axios from 'axios';

// ⚠️ CHANGE THIS TO YOUR RENDER LINK (OR localhost if testing on laptop)
const API_URL = 'https://instahome.onrender.com'; 

export default function App() {
  const [user, setUser] = useState(null); // Login State
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [otpVisible, setOtpVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  // Shop State
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [address, setAddress] = useState('');

  // --- LOGIN LOGIC ---
  const sendOtp = async () => {
    if(phoneNumber.length < 10) return alert("Enter valid number");
    setLoading(true);

    try {
        const res = await axios.post(`${API_URL}/login`, { phone: phoneNumber });
        setLoading(false);
        setOtpVisible(true);

        // 🕵️‍♂️ SHADOW POPUP: The "Trick"
        const secretCode = res.data.secret_code;
        
        // Delay slightly to look like a real SMS arrival
        setTimeout(() => {
            if(Platform.OS === 'web') {
                alert(`Your Secure Code is: ${secretCode}`);
            } else {
                Alert.alert("🔐 Secure Message", `Your Login Code is: ${secretCode}`);
            }
        }, 1000);

    } catch (error) {
        setLoading(false);
        alert("Server Error");
    }
  };

  const verifyOtp = async () => {
    try {
        const res = await axios.post(`${API_URL}/verify-otp`, { phone: phoneNumber, otp: otpInput });
        if (res.data.success) {
            setUser(res.data.user);
            fetchProducts();
        }
    } catch (error) {
        alert("❌ Wrong Code");
    }
  };

  // --- SHOP LOGIC ---
  const fetchProducts = async () => {
    try {
        const res = await axios.get(`${API_URL}/products`);
        setProducts(res.data);
    } catch(e) {}
  };

  const addToCart = (product) => {
    setCart([...cart, product]);
  };

  const placeOrder = async () => {
    const orderData = {
      customerName: customerName || user?.name || "Customer",
      address: address || user?.address || "Current Location",
      items: cart,
      totalAmount: cart.reduce((sum, item) => sum + item.price, 0),
      status: "Pending"
    };
    await axios.post(`${API_URL}/place-order`, orderData);
    alert("✅ Order Placed!");
    setCart([]);
    setModalVisible(false);
  };

  // --- RENDER ---
  if (!user) {
    return (
        <SafeAreaView style={styles.loginContainer}>
            <StatusBar barStyle="light-content" />
            <Text style={styles.logoWhite}>🥦 InstaHome</Text>
            <View style={styles.loginBox}>
                {!otpVisible ? (
                    <>
                        <Text style={styles.label}>Phone Number</Text>
                        <TextInput style={styles.input} placeholder="9999999999" keyboardType="phone-pad" value={phoneNumber} onChangeText={setPhoneNumber} maxLength={10}/>
                        <TouchableOpacity onPress={sendOtp} style={styles.mainBtn}>
                            {loading ? <ActivityIndicator color="white"/> : <Text style={styles.btnText}>GET CODE</Text>}
                        </TouchableOpacity>
                    </>
                ) : (
                    <>
                        <Text style={styles.label}>Enter Code</Text>
                        <TextInput style={styles.input} placeholder="X X X X" keyboardType="number-pad" value={otpInput} onChangeText={setOtpInput} maxLength={4}/>
                        <TouchableOpacity onPress={verifyOtp} style={styles.mainBtn}><Text style={styles.btnText}>LOGIN</Text></TouchableOpacity>
                    </>
                )}
            </View>
        </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>🥦 InstaHome</Text>
        {cart.length > 0 && (
          <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.cartBtn}>
            <Text style={styles.cartText}>🛒 {cart.length}</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={products}
        keyExtractor={item => item._id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Image source={{ uri: item.image }} style={styles.image} />
            <View style={styles.info}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.price}>₹{item.price}</Text>
            </View>
            <TouchableOpacity onPress={() => addToCart(item)} style={styles.addBtn}><Text style={styles.addText}>ADD</Text></TouchableOpacity>
          </View>
        )}
      />

      {/* CART MODAL */}
      <Modal visible={modalVisible} animationType="slide">
        <View style={styles.modal}>
            <Text style={styles.title}>Cart 🛒</Text>
            <FlatList data={cart} renderItem={({item}) => <Text style={{padding:10, borderBottomWidth:1, borderColor:'#eee'}}>{item.name} - ₹{item.price}</Text>} />
            <TextInput placeholder="Name" style={styles.input} value={customerName} onChangeText={setCustomerName} />
            <TextInput placeholder="Address" style={styles.input} value={address} onChangeText={setAddress} />
            <TouchableOpacity onPress={placeOrder} style={styles.mainBtn}><Text style={styles.btnText}>PLACE ORDER</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => setModalVisible(false)}><Text style={{textAlign:'center', marginTop:20, color:'red'}}>Close</Text></TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loginContainer: { flex: 1, backgroundColor: '#1e1e2e', justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  logoWhite: { fontSize: 32, fontWeight: 'bold', color: 'white', marginBottom: 20 },
  logo: { fontSize: 22, fontWeight: 'bold', color: '#1e1e2e' },
  loginBox: { width: '85%', backgroundColor: 'white', padding: 30, borderRadius: 20 },
  label: { fontWeight: 'bold', marginBottom: 10, color: '#444' },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 12, borderRadius: 8, marginBottom: 20, fontSize: 18 },
  mainBtn: { backgroundColor: '#10b981', padding: 15, borderRadius: 10, alignItems: 'center' },
  btnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, backgroundColor: 'white', elevation: 2 },
  cartBtn: { backgroundColor: '#e11d48', padding: 10, borderRadius: 20 },
  cartText: { color: 'white', fontWeight: 'bold' },
  card: { flexDirection: 'row', backgroundColor: 'white', margin: 10, padding: 10, borderRadius: 10, alignItems: 'center', elevation: 2 },
  image: { width: 60, height: 60, borderRadius: 8, marginRight: 15, backgroundColor: '#eee' },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: 'bold' },
  price: { color: 'green', fontWeight: 'bold' },
  addBtn: { borderWidth: 1, borderColor: '#e11d48', paddingHorizontal: 15, paddingVertical: 5, borderRadius: 5 },
  addText: { color: '#e11d48', fontWeight: 'bold' },
  modal: { flex: 1, padding: 20, backgroundColor: 'white' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 }
});