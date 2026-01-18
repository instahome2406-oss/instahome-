import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, FlatList, Image, TouchableOpacity, SafeAreaView, Platform, Modal, TextInput, StatusBar, Alert, ActivityIndicator, ScrollView, Dimensions } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';

// ⚠️ YOUR CLOUD SERVER
const API_URL = 'https://instahome.onrender.com'; 
const { width } = Dimensions.get('window');

// 🎨 BRAND PALETTE (Zepto Purple + Blinkit Green)
const COLORS = {
  primary: '#340C3B', // Zepto Dark Purple
  secondary: '#FF3269', // Zepto Pink
  green: '#0C831F',   // Blinkit Green
  bg: '#F4F6FB',      // Light Gray Background
  white: '#FFFFFF',
  text: '#1C1C1C',
  gray: '#888888',
  border: '#E0E0E0'
};

export default function App() {
  // Auth State
  const [user, setUser] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [otpVisible, setOtpVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deviceKey, setDeviceKey] = useState('');

  // Shop State
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]); 
  const [modalVisible, setModalVisible] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [address, setAddress] = useState('');
  
  // --- 1. INITIALIZATION & SECURITY ---
  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    // Generate/Get Device Lock ID
    let key = await AsyncStorage.getItem('device_key');
    if (!key) {
        key = Math.random().toString(36).substring(2);
        await AsyncStorage.setItem('device_key', key);
    }
    setDeviceKey(key);

    // Auto Login
    const savedUser = await AsyncStorage.getItem('user');
    if(savedUser) {
        setUser(JSON.parse(savedUser));
        fetchProducts();
    }
  };

  // --- 2. SECURE LOGIN LOGIC ---
  const sendOtp = async () => {
    if(phoneNumber.length < 10) return alert("Invalid Number");
    setLoading(true);
    try {
        const res = await axios.post(`${API_URL}/login`, { phone: phoneNumber, deviceId: deviceKey });
        setLoading(false);
        setOtpVisible(true);
        const secretCode = res.data.secret_code;
        
        setTimeout(() => {
            if(Platform.OS === 'web') alert(`Code: ${secretCode}`);
            else Alert.alert("🔐 Login Code", `${secretCode}`, [{text:"OK"}]);
        }, 500);
    } catch (error) {
        setLoading(false);
        if(error.response?.status === 403) alert("⛔ Access Denied: Device Mismatch");
        else alert("Server Error");
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
    } catch (error) { alert("❌ Wrong Code"); }
  };

  const logout = async () => {
      await AsyncStorage.removeItem('user');
      setUser(null);
      setCart([]);
  }

  // --- 3. CART ENGINE ---
  const fetchProducts = async () => {
    try {
        const res = await axios.get(`${API_URL}/products`);
        setProducts(res.data);
    } catch(e){}
  };

  // Helper: Get Qty of specific item
  const getQty = (item) => {
    const found = cart.find(x => x._id === item._id);
    return found ? found.qty : 0;
  };

  // Add (+1)
  const addItem = (item) => {
    const existing = cart.find(x => x._id === item._id);
    if (existing) {
        setCart(cart.map(x => x._id === item._id ? { ...x, qty: x.qty + 1 } : x));
    } else {
        setCart([...cart, { ...item, qty: 1 }]);
    }
  };

  // Remove (-1)
  const removeItem = (item) => {
    const existing = cart.find(x => x._id === item._id);
    if (existing.qty === 1) {
        setCart(cart.filter(x => x._id !== item._id));
    } else {
        setCart(cart.map(x => x._id === item._id ? { ...x, qty: x.qty - 1 } : x));
    }
  };

  const cartTotal = cart.reduce((a, b) => a + (b.price * b.qty), 0);
  const cartCount = cart.reduce((a, b) => a + b.qty, 0);

  const placeOrder = async () => {
    if(!customerName || !address) return alert("Please enter details");
    const orderData = {
      customerName, address, items: cart,
      totalAmount: cartTotal,
      status: "Pending"
    };
    await axios.post(`${API_URL}/place-order`, orderData);
    Alert.alert("🎉 Order Placed!", "Arriving in 10 minutes.");
    setCart([]);
    setModalVisible(false);
  };

  // --- 4. UI COMPONENTS ---

  const renderBanner = () => (
      <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} style={styles.bannerScroll}>
          <Image source={{uri: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=540/layout-engine/2022-05/Group-33704.jpg'}} style={styles.bannerImg} />
          <Image source={{uri: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=540/layout-engine/2022-05/Group-33704.jpg'}} style={styles.bannerImg} />
      </ScrollView>
  );

  const renderProduct = ({ item }) => {
      const qty = getQty(item);
      return (
        <View style={styles.prodCard}>
            <View style={styles.badge}><Text style={styles.badgeText}>12% OFF</Text></View>
            <Image source={{ uri: item.image || 'https://via.placeholder.com/150' }} style={styles.prodImg} />
            <Text numberOfLines={2} style={styles.prodName}>{item.name}</Text>
            <Text style={styles.prodWeight}>500 g</Text>
            
            <View style={styles.prodFooter}>
                <Text style={styles.prodPrice}>₹{item.price}</Text>
                
                {qty === 0 ? (
                    <TouchableOpacity onPress={() => addItem(item)} style={styles.addBtn}>
                        <Text style={styles.addBtnText}>ADD</Text>
                    </TouchableOpacity>
                ) : (
                    <View style={styles.counterBtn}>
                        <TouchableOpacity onPress={() => removeItem(item)}><Text style={styles.counterSign}>-</Text></TouchableOpacity>
                        <Text style={styles.counterNum}>{qty}</Text>
                        <TouchableOpacity onPress={() => addItem(item)}><Text style={styles.counterSign}>+</Text></TouchableOpacity>
                    </View>
                )}
            </View>
        </View>
      );
  };

  // --- RENDER SCREEN ---

  if (!user) {
    return (
        <SafeAreaView style={styles.loginContainer}>
            <StatusBar barStyle="light-content" />
            <View style={{alignItems:'center', marginBottom:50}}>
                <Text style={styles.logoBig}>🥦 InstaHome</Text>
                <Text style={{color:'#ccc', letterSpacing:1}}>GROCERY IN 8 MINS</Text>
            </View>
            <View style={styles.loginBox}>
                {!otpVisible ? (
                    <>
                        <Text style={styles.label}>Log in or Sign up</Text>
                        <TextInput style={styles.input} placeholder="+91  Mobile Number" keyboardType="phone-pad" value={phoneNumber} onChangeText={setPhoneNumber} maxLength={10}/>
                        <TouchableOpacity onPress={sendOtp} style={styles.mainBtn}>
                            {loading ? <ActivityIndicator color="white"/> : <Text style={styles.btnText}>Continue</Text>}
                        </TouchableOpacity>
                    </>
                ) : (
                    <>
                        <Text style={styles.label}>Verification Code</Text>
                        <TextInput style={[styles.input, {textAlign:'center', letterSpacing:5}]} placeholder="- - - -" keyboardType="number-pad" value={otpInput} onChangeText={setOtpInput} maxLength={4}/>
                        <TouchableOpacity onPress={verifyOtp} style={styles.mainBtn}><Text style={styles.btnText}>Verify & Login</Text></TouchableOpacity>
                    </>
                )}
            </View>
        </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff"/>
      
      {/* HEADER */}
      <View style={styles.header}>
        <View style={{flexDirection:'row', alignItems:'center'}}>
            <View style={styles.locIcon}><Ionicons name="location-sharp" size={22} color={COLORS.primary}/></View>
            <View>
                <Text style={styles.headerTitle}>Home <Ionicons name="caret-down" size={12}/></Text>
                <Text style={styles.headerSub}>15 Mins to {user.address || "My Location"}</Text>
            </View>
        </View>
        <TouchableOpacity onPress={logout}><MaterialCommunityIcons name="account-circle-outline" size={32} color="#333"/></TouchableOpacity>
      </View>

      {/* SEARCH */}
      <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
              <Ionicons name="search" size={20} color="#888"/>
              <TextInput placeholder='Search "Milk"' style={{flex:1, marginLeft:10}}/>
          </View>
      </View>

      <ScrollView contentContainerStyle={{paddingBottom: 120}}>
          {/* BANNER */}
          {renderBanner()}

          {/* CATEGORIES */}
          <Text style={styles.sectionTitle}>Shop by Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{paddingLeft:15, marginBottom:20}}>
              {["Fruits", "Veg", "Dairy", "Snacks", "Drinks", "Bakery"].map((cat, i) => (
                  <View key={i} style={styles.catItem}>
                      <View style={styles.catCircle}><Text style={{fontSize:24}}>🥬</Text></View>
                      <Text style={styles.catText}>{cat}</Text>
                  </View>
              ))}
          </ScrollView>

          {/* PRODUCTS */}
          <Text style={styles.sectionTitle}>Your Daily Needs</Text>
          <FlatList
            data={products}
            keyExtractor={item => item._id}
            renderItem={renderProduct}
            numColumns={2}
            scrollEnabled={false}
            columnWrapperStyle={{justifyContent:'space-between', paddingHorizontal:15}}
          />
      </ScrollView>

      {/* FLOATING CART BAR */}
      {cart.length > 0 && (
        <View style={styles.floatBar}>
            <View style={{flexDirection:'row', alignItems:'center'}}>
                <View style={styles.floatBadge}><Text style={{color:'white', fontWeight:'bold'}}>{cartCount}</Text></View>
                <View style={{marginLeft:10}}>
                    <Text style={{color:'white', fontWeight:'700', fontSize:16}}>₹{cartTotal}</Text>
                    <Text style={{color:'#D1F2D9', fontSize:11}}>TOTAL</Text>
                </View>
            </View>
            <TouchableOpacity onPress={() => setModalVisible(true)} style={{flexDirection:'row', alignItems:'center'}}>
                <Text style={{color:'white', fontWeight:'bold', fontSize:16, marginRight:5}}>View Cart</Text>
                <Ionicons name="caret-forward" size={16} color="white"/>
            </TouchableOpacity>
        </View>
      )}

      {/* CHECKOUT MODAL */}
      <Modal visible={modalVisible} animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <SafeAreaView style={{flex:1, backgroundColor:'#F4F6FB'}}>
            <View style={{padding:20, backgroundColor:'white', flexDirection:'row', justifyContent:'space-between', alignItems:'center'}}>
                <Text style={{fontSize:20, fontWeight:'bold'}}>Checkout</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}><Ionicons name="close" size={28}/></TouchableOpacity>
            </View>
            <ScrollView style={{padding:15}}>
                <View style={styles.checkoutCard}>
                    {cart.map((item, idx) => (
                        <View key={idx} style={styles.checkoutRow}>
                            <Text style={{width:'50%'}}>{item.name}</Text>
                            <View style={{flexDirection:'row'}}>
                                <Text style={{fontWeight:'bold', marginRight:10}}>x{item.qty}</Text>
                                <Text style={{fontWeight:'bold'}}>₹{item.price * item.qty}</Text>
                            </View>
                        </View>
                    ))}
                    <View style={styles.totalRow}>
                        <Text style={{fontWeight:'bold', fontSize:18}}>To Pay</Text>
                        <Text style={{fontWeight:'bold', fontSize:18, color: COLORS.green}}>₹{cartTotal}</Text>
                    </View>
                </View>
                <Text style={styles.label}>Delivery Address</Text>
                <TextInput style={styles.inputWhite} placeholder="Full Name" value={customerName} onChangeText={setCustomerName} />
                <TextInput style={styles.inputWhite} placeholder="House / Flat No." value={address} onChangeText={setAddress} multiline />
            </ScrollView>
            <View style={styles.footer}>
                <TouchableOpacity onPress={placeOrder} style={styles.payBtn}>
                    <Text style={{color:'white', fontWeight:'bold', fontSize:18}}>PLACE ORDER</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Login
  loginContainer: { flex: 1, backgroundColor: '#210926', justifyContent: 'center' },
  loginBox: { backgroundColor: 'white', borderTopLeftRadius: 25, borderTopRightRadius: 25, padding: 30, height: '45%', position:'absolute', bottom:0, width:'100%' },
  logoBig: { fontSize: 40, fontWeight: '900', color: COLORS.secondary, letterSpacing:-1 },
  label: { fontWeight: '700', marginBottom: 10, color: '#333', fontSize: 16 },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 15, borderRadius: 12, marginBottom: 20, fontSize: 18, backgroundColor:'#F9F9F9' },
  mainBtn: { backgroundColor: COLORS.secondary, padding: 16, borderRadius: 12, alignItems: 'center' },
  btnText: { color: 'white', fontWeight: 'bold', fontSize: 18 },

  // Home
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { padding: 15, backgroundColor: 'white', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  locIcon: { backgroundColor: '#F3E5F5', padding: 8, borderRadius: 50, marginRight: 10 },
  headerTitle: { fontWeight: '900', fontSize: 18, color: COLORS.primary },
  headerSub: { color: '#666', fontSize: 12 },
  searchContainer: { backgroundColor:'white', paddingHorizontal:15, paddingBottom:15 },
  searchBar: { flexDirection:'row', backgroundColor:'#F4F6FB', padding:12, borderRadius:12, alignItems:'center', borderWidth:1, borderColor: COLORS.border },
  
  bannerScroll: { marginTop:15, height:180, paddingHorizontal:15 },
  bannerImg: { width: width-30, height:160, borderRadius:16, marginRight:10 },
  
  sectionTitle: { fontSize: 18, fontWeight: '800', marginLeft: 15, marginBottom: 15, marginTop: 10, color: '#333' },
  catItem: { alignItems:'center', marginRight:20 },
  catCircle: { width:70, height:70, backgroundColor:'#E8F5E9', borderRadius:35, justifyContent:'center', alignItems:'center', marginBottom:5 },
  catText: { fontSize:12, fontWeight:'600', color:'#555' },

  // Products
  prodCard: { backgroundColor: 'white', width: (width/2)-22, borderRadius: 12, padding: 10, marginBottom: 15, borderWidth: 1, borderColor: '#EEE' },
  badge: { position:'absolute', top:0, left:0, backgroundColor:'#5D2E90', paddingHorizontal:6, paddingVertical:2, borderTopLeftRadius:12, borderBottomRightRadius:8, zIndex:1 },
  badgeText: { color:'white', fontSize:9, fontWeight:'bold' },
  prodImg: { width:'100%', height:100, resizeMode:'contain', marginBottom:10 },
  prodName: { fontWeight:'700', fontSize:14, color:'#333', height: 40 },
  prodWeight: { color:'#888', fontSize:12, marginBottom:10 },
  prodFooter: { flexDirection:'row', justifyContent:'space-between', alignItems:'center' },
  prodPrice: { fontSize:15, fontWeight:'900', color:'#333' },
  addBtn: { borderColor: COLORS.green, borderWidth:1, paddingHorizontal:15, paddingVertical:6, borderRadius:6, backgroundColor:'#F0FFF4' },
  addBtnText: { color: COLORS.green, fontWeight:'900', fontSize:12 },
  counterBtn: { flexDirection:'row', alignItems:'center', backgroundColor: COLORS.green, borderRadius:6, paddingHorizontal:5, paddingVertical:4 },
  counterSign: { color:'white', fontSize:16, fontWeight:'bold', paddingHorizontal:8 },
  counterNum: { color:'white', fontWeight:'bold', fontSize:14 },

  // Float Bar
  floatBar: { position:'absolute', bottom:20, left:15, right:15, backgroundColor: COLORS.green, borderRadius:12, flexDirection:'row', justifyContent:'space-between', padding:15, alignItems:'center', elevation:10 },
  floatBadge: { borderWidth:1, borderColor:'white', paddingHorizontal:8, paddingVertical:2, borderRadius:4 },

  // Checkout
  checkoutCard: { backgroundColor:'white', borderRadius:12, padding:15, marginBottom:20 },
  checkoutRow: { flexDirection:'row', justifyContent:'space-between', paddingVertical:10, borderBottomWidth:1, borderColor:'#eee' },
  totalRow: { flexDirection:'row', justifyContent:'space-between', marginTop:15, paddingTop:15, borderTopWidth:1, borderColor:'#eee' },
  inputWhite: { backgroundColor:'white', padding:15, borderRadius:12, marginBottom:15, borderWidth:1, borderColor:'#ddd' },
  footer: { padding:20, backgroundColor:'white', elevation:20 },
  payBtn: { backgroundColor: COLORS.primary, padding:18, borderRadius:12, alignItems:'center' }
});