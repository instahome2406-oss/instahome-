import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, FlatList, Image, TouchableOpacity, SafeAreaView, Platform, Modal, TextInput, StatusBar, Alert, ActivityIndicator } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ⚠️ YOUR CLOUD SERVER
const API_URL = 'https://instahome.onrender.com'; 

export default function App() {
  const [user, setUser] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [otpVisible, setOtpVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // 🔐 DIGITAL DEVICE KEY
  const [deviceKey, setDeviceKey] = useState('');

  // Shop States
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [address, setAddress] = useState('');

  // 1. SETUP UNIQUE DEVICE KEY (Run Once)
  useEffect(() => {
    setupSecurity();
  }, []);

  const setupSecurity = async () => {
    // Check if this phone already has an ID
    let key = await AsyncStorage.getItem('device_key');
    if (!key) {
        // Generate a random unique ID (The Fingerprint)
        key = Math.random().toString(36).substring(2) + Date.now().toString(36);
        await AsyncStorage.setItem('device_key', key);
    }
    setDeviceKey(key);
    
    // Auto Login Check
    const savedUser = await AsyncStorage.getItem('user');
    if(savedUser) setUser(JSON.parse(savedUser));
  };

  // 2. SECURE LOGIN
  const sendOtp = async () => {
    if(phoneNumber.length < 10) return alert("Enter valid number");
    setLoading(true);

    try {
        // Send Phone + Device Key
        const res = await axios.post(`${API_URL}/login`, { 
            phone: phoneNumber,
            deviceId: deviceKey 
        });
        
        setLoading(false);
        setOtpVisible(true);

        const secretCode = res.data.secret_code;
        setTimeout(() => {
            if(Platform.OS === 'web') alert(`Code: ${secretCode}`);
            else Alert.alert("🔐 Login Code", `${secretCode}`, [{ text: "OK" }]);
        }, 500);

    } catch (error) {
        setLoading(false);
        
        // ⛔ CATCH THE SECURITY BLOCK
        if (error.response && error.response.status === 403) {
            Alert.alert(
                "⛔ Security Alert", 
                "This number is registered on another device. You cannot login here."
            );
        } else {
            alert("Server Error. Is it running?");
        }
    }
  };

  const verifyOtp = async () => {
    try {
        const res = await axios.post(`${API_URL}/verify-otp`, { phone: phoneNumber, otp: otpInput });
        if (res.data.success) {
            setUser(res.data.user);
            await AsyncStorage.setItem('user', JSON.stringify(res.data.user));
            fetchProducts();
        }
    } catch (error) {
        alert("❌ Wrong Code");
    }
  };

  const logout = async () => {
      await AsyncStorage.removeItem('user');
      setUser(null);
  }

  // --- SHOP ---
  useEffect(() => { if(user) fetchProducts(); }, [user]);
  const fetchProducts = async () => { try { const res = await axios.get(`${API_URL}/products`); setProducts(res.data); } catch(e){} };
  const placeOrder = async () => {
    await axios.post(`${API_URL}/place-order`, { customerName, address, items: cart, totalAmount: 100 });
    Alert.alert("✅ Order Placed!"); setCart([]); setModalVisible(false);
  };

  // --- RENDER ---
  if (!user) {
    return (
        <SafeAreaView style={styles.loginContainer}>
            <StatusBar barStyle="light-content" />
            <Text style={styles.logoWhite}>🥦 InstaHome PRO</Text>
            <View style={styles.loginBox}>
                {!otpVisible ? (
                    <>
                        <TextInput style={styles.input} placeholder="9999999999" keyboardType="phone-pad" value={phoneNumber} onChangeText={setPhoneNumber} maxLength={10}/>
                        <TouchableOpacity onPress={sendOtp} style={styles.mainBtn}>
                            {loading ? <ActivityIndicator color="white"/> : <Text style={styles.btnText}>GET CODE</Text>}
                        </TouchableOpacity>
                    </>
                ) : (
                    <>
                        <TextInput style={styles.input} placeholder="Code" keyboardType="number-pad" value={otpInput} onChangeText={setOtpInput} maxLength={4}/>
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
            <TouchableOpacity onPress={logout}><Text style={{color:'red'}}>Logout</Text></TouchableOpacity>
        </View>
        <FlatList data={products} keyExtractor={i=>i._id} renderItem={({item})=> (
            <View style={styles.card}>
                <Text style={{fontWeight:'bold'}}>{item.name}</Text>
                <Text style={{color:'green'}}>₹{item.price}</Text>
                <TouchableOpacity onPress={()=>setCart([...cart, item])} style={{backgroundColor:'#eee', padding:5}}><Text>ADD</Text></TouchableOpacity>
            </View>
        )}/>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loginContainer: { flex: 1, backgroundColor: '#1e1e2e', justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1, backgroundColor: '#fff', paddingTop: 30 },
  logoWhite: { fontSize: 32, fontWeight: 'bold', color: 'white', marginBottom: 20 },
  loginBox: { width: '85%', backgroundColor: 'white', padding: 30, borderRadius: 20 },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 12, borderRadius: 8, marginBottom: 20, fontSize: 18 },
  mainBtn: { backgroundColor: '#10b981', padding: 15, borderRadius: 10, alignItems: 'center' },
  btnText: { color: 'white', fontWeight: 'bold' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20 },
  logo: { fontSize: 20, fontWeight: 'bold' },
  card: { padding: 20, borderBottomWidth: 1, borderColor: '#eee', flexDirection: 'row', justifyContent: 'space-between' }
});