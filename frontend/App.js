import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, Text, View, FlatList, Image, TouchableOpacity, SafeAreaView, Platform, Modal, TextInput, StatusBar, Alert, ActivityIndicator, ScrollView, Dimensions, Animated } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import * as Device from 'expo-device';

const API_URL = 'https://instahome.onrender.com'; 
const { width } = Dimensions.get('window');

// 🎨 ZEPTO + BLINKIT THEME
const COLORS = {
  primary: '#340C3B', // Zepto Purple
  secondary: '#FF3269', // Zepto Pink
  green: '#0C831F', // Blinkit Green
  bg: '#F4F6FB',
  white: '#FFF',
  text: '#1C1C1C',
  border: '#E8E8E8'
};

export default function App() {
  const [appReady, setAppReady] = useState(false);
  const [user, setUser] = useState(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Auth
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [otpVisible, setOtpVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deviceModel, setDeviceModel] = useState('');

  // Shop
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [successVisible, setSuccessVisible] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [address, setAddress] = useState('');

  // 1. SMART WAKE UP
  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();
    initApp();
  }, []);

  const initApp = async () => {
    setDeviceModel(Device.modelName || "Android");
    try {
        // Ping Server to Wake Up
        await axios.get(`${API_URL}/products`);
    } catch (e) { /* Server might be sleeping, ignore error */ }

    // Auto Login
    const savedUser = await AsyncStorage.getItem('user');
    if(savedUser) {
        setUser(JSON.parse(savedUser));
        fetchProducts();
    }
    setAppReady(true);
  };

  // 2. AUTH
  const sendOtp = async () => {
    if(phoneNumber.length < 10) return alert("Enter valid number");
    setLoading(true);
    try {
        const res = await axios.post(`${API_URL}/login`, { phone: phoneNumber, deviceId: deviceModel });
        setLoading(false);
        setOtpVisible(true);
        
        const code = res.data.secret_code;
        setTimeout(() => {
            if(Platform.OS==='web') alert(`Code: ${code}`);
            else Alert.alert("🔐 Login Code", `Your OTP: ${code}`, [{text:"OK"}]);
        }, 500);
    } catch (error) {
        setLoading(false);
        if(error.response?.status === 403) Alert.alert("⛔ Access Denied", "This number is locked to another phone.");
        else Alert.alert("Server Sleeping", "Please try again in 30 seconds.");
    }
  };

  const verifyOtp = async () => {
    try {
        const res = await axios.post(`${API_URL}/verify-otp`, { phone: phoneNumber, otp: otpInput });
        if(res.data.success) {
            setUser(res.data.user);
            await AsyncStorage.setItem('user', JSON.stringify(res.data.user));
            fetchProducts();
        }
    } catch(e) { Alert.alert("❌ Wrong Code"); }
  };

  const logout = async () => {
      await AsyncStorage.removeItem('user');
      setUser(null);
      setCart([]);
  }

  // 3. SHOPPING
  const fetchProducts = async () => {
      try { const res = await axios.get(`${API_URL}/products`); setProducts(res.data); } catch(e){}
  };

  const getQty = (id) => { const item = cart.find(x => x._id === id); return item ? item.qty : 0; }
  
  const updateQty = (item, delta) => {
      const existing = cart.find(x => x._id === item._id);
      if(existing) {
          const newQty = existing.qty + delta;
          if(newQty <= 0) setCart(cart.filter(x => x._id !== item._id));
          else setCart(cart.map(x => x._id === item._id ? {...x, qty: newQty} : x));
      } else if (delta > 0) {
          setCart([...cart, {...item, qty: 1}]);
      }
  };

  const cartTotal = cart.reduce((a,b) => a + (b.price * b.qty), 0);
  const cartCount = cart.reduce((a,b) => a + b.qty, 0);

  const placeOrder = async () => {
      if(!customerName || !address) return Alert.alert("Missing Details", "Please enter Name & Address");
      
      const order = {
          customerName, address, phone: user.phone,
          items: cart, totalAmount: cartTotal, paymentMode: "COD"
      };
      
      await axios.post(`${API_URL}/place-order`, order);
      setCart([]);
      setModalVisible(false);
      setSuccessVisible(true);
  };

  // --- RENDER ---

  // SPLASH SCREEN
  if(!appReady) {
      return (
          <View style={{flex:1, backgroundColor: COLORS.primary, justifyContent:'center', alignItems:'center'}}>
              <Animated.View style={{opacity: fadeAnim, alignItems:'center'}}>
                  <Text style={{fontSize:60}}>🥦</Text>
                  <Text style={{fontSize:30, fontWeight:'bold', color:'white', marginTop:10}}>InstaHome</Text>
                  <ActivityIndicator size="large" color={COLORS.secondary} style={{marginTop:30}}/>
              </Animated.View>
          </View>
      );
  }

  // SUCCESS SCREEN
  if(successVisible) {
      return (
          <View style={{flex:1, backgroundColor:'white', justifyContent:'center', alignItems:'center'}}>
              <Ionicons name="checkmark-circle" size={100} color={COLORS.green} />
              <Text style={{fontSize:24, fontWeight:'bold', marginTop:20}}>Order Placed!</Text>
              <Text style={{color:'#666', marginTop:10}}>Pay ₹{cartTotal} on Delivery</Text>
              <TouchableOpacity onPress={()=>setSuccessVisible(false)} style={styles.btnPrimary}>
                  <Text style={{color:'white', fontWeight:'bold'}}>Done</Text>
              </TouchableOpacity>
          </View>
      );
  }

  // LOGIN SCREEN
  if (!user) {
    return (
        <SafeAreaView style={styles.loginContainer}>
            <View style={{alignItems:'center', marginBottom:50}}>
                <Text style={styles.logoBig}>🥦 InstaHome</Text>
                <Text style={{color:'#aaa', letterSpacing:2, fontSize:12}}>GROCERY IN 8 MINS</Text>
            </View>
            <View style={styles.loginBox}>
                <Text style={{fontSize:20, fontWeight:'bold', marginBottom:20}}>Login</Text>
                {!otpVisible ? (
                    <>
                        <TextInput style={styles.input} placeholder="Mobile Number" keyboardType="phone-pad" value={phoneNumber} onChangeText={setPhoneNumber}/>
                        <TouchableOpacity onPress={sendOtp} style={styles.btnPrimary}>
                            {loading ? <ActivityIndicator color="white"/> : <Text style={styles.btnText}>Continue</Text>}
                        </TouchableOpacity>
                    </>
                ) : (
                    <>
                        <TextInput style={[styles.input, {textAlign:'center', letterSpacing:5}]} placeholder="OTP" keyboardType="number-pad" value={otpInput} onChangeText={setOtpInput}/>
                        <TouchableOpacity onPress={verifyOtp} style={styles.btnPrimary}><Text style={styles.btnText}>Verify</Text></TouchableOpacity>
                    </>
                )}
            </View>
        </SafeAreaView>
    );
  }

  // MAIN SHOP SCREEN
  return (
    <SafeAreaView style={{flex:1, backgroundColor: COLORS.bg}}>
      <StatusBar barStyle="dark-content" backgroundColor="white"/>
      
      {/* Header */}
      <View style={styles.header}>
          <View>
              <Text style={{fontSize:18, fontWeight:'bold', color: COLORS.primary}}>📍 {address ? "Home" : "Set Location"}</Text>
              <Text style={{color:'#666', fontSize:12}}>10 Mins to {user.phone}</Text>
          </View>
          <TouchableOpacity onPress={logout}><MaterialCommunityIcons name="logout" size={24} color={COLORS.secondary}/></TouchableOpacity>
      </View>

      {/* Search */}
      <View style={{padding:15, backgroundColor:'white'}}>
          <View style={styles.searchBar}>
              <Ionicons name="search" size={20} color="#999"/>
              <TextInput placeholder='Search "Milk"' style={{marginLeft:10, flex:1}}/>
          </View>
      </View>

      <ScrollView contentContainerStyle={{paddingBottom: 100}}>
          {/* Banner */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginVertical:15, marginLeft:15}}>
              <Image source={{uri:'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=540/layout-engine/2022-05/Group-33704.jpg'}} style={styles.banner}/>
              <Image source={{uri:'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=540/layout-engine/2022-05/Group-33704.jpg'}} style={styles.banner}/>
          </ScrollView>

          {/* Categories */}
          <Text style={styles.sectionTitle}>Shop by Category</Text>
          <View style={{flexDirection:'row', flexWrap:'wrap', paddingHorizontal:15}}>
              {["Dairy", "Fruits", "Veg", "Snacks", "Drinks", "Bakery"].map((c,i)=>(
                  <View key={i} style={styles.catItem}>
                      <View style={styles.catIcon}><Text style={{fontSize:20}}>🥬</Text></View>
                      <Text style={{fontSize:10, marginTop:5}}>{c}</Text>
                  </View>
              ))}
          </View>

          {/* Products */}
          <Text style={styles.sectionTitle}>Best Sellers</Text>
          <FlatList
            data={products}
            keyExtractor={i=>i._id}
            numColumns={2}
            scrollEnabled={false}
            columnWrapperStyle={{justifyContent:'space-between', paddingHorizontal:15}}
            renderItem={({item}) => {
                const qty = getQty(item._id);
                return (
                    <View style={styles.prodCard}>
                        <Image source={{uri: item.image}} style={styles.prodImg}/>
                        <Text numberOfLines={1} style={styles.prodName}>{item.name}</Text>
                        <Text style={styles.prodUnit}>{item.qty}</Text>
                        <View style={styles.prodRow}>
                            <Text style={styles.prodPrice}>₹{item.price}</Text>
                            {qty===0 ? (
                                <TouchableOpacity onPress={()=>updateQty(item, 1)} style={styles.addBtn}>
                                    <Text style={{color: COLORS.green, fontWeight:'bold', fontSize:12}}>ADD</Text>
                                </TouchableOpacity>
                            ) : (
                                <View style={styles.qtyBox}>
                                    <TouchableOpacity onPress={()=>updateQty(item, -1)}><Text style={styles.qtyText}>-</Text></TouchableOpacity>
                                    <Text style={styles.qtyText}>{qty}</Text>
                                    <TouchableOpacity onPress={()=>updateQty(item, 1)}><Text style={styles.qtyText}>+</Text></TouchableOpacity>
                                </View>
                            )}
                        </View>
                    </View>
                )
            }}
          />
      </ScrollView>

      {/* Float Cart */}
      {cart.length > 0 && (
          <View style={styles.floatBar}>
              <View>
                  <Text style={{color:'white', fontWeight:'bold'}}>{cartCount} Items | ₹{cartTotal}</Text>
                  <Text style={{color:'#D1F2D9', fontSize:10}}>Extra charges may apply</Text>
              </View>
              <TouchableOpacity onPress={()=>setModalVisible(true)}>
                  <Text style={{color:'white', fontWeight:'bold'}}>View Cart ➜</Text>
              </TouchableOpacity>
          </View>
      )}

      {/* Checkout Modal */}
      <Modal visible={modalVisible} animationType="slide">
          <SafeAreaView style={{flex:1, backgroundColor:'#F5F7FD'}}>
              <View style={{padding:20, backgroundColor:'white', flexDirection:'row', justifyContent:'space-between'}}>
                  <Text style={{fontSize:18, fontWeight:'bold'}}>My Cart</Text>
                  <TouchableOpacity onPress={()=>setModalVisible(false)}><Ionicons name="close" size={24}/></TouchableOpacity>
              </View>
              <ScrollView style={{padding:15}}>
                  <View style={styles.cartCard}>
                      {cart.map((item,i)=>(
                          <View key={i} style={styles.cartItem}>
                              <Text style={{flex:1}}>{item.name}</Text>
                              <Text style={{fontWeight:'bold'}}>x{item.qty}</Text>
                              <Text style={{fontWeight:'bold', marginLeft:15}}>₹{item.price*item.qty}</Text>
                          </View>
                      ))}
                      <View style={{borderTopWidth:1, borderColor:'#eee', marginTop:15, paddingTop:15, flexDirection:'row', justifyContent:'space-between'}}>
                          <Text style={{fontWeight:'bold'}}>To Pay</Text>
                          <Text style={{fontWeight:'bold', color: COLORS.green, fontSize:18}}>₹{cartTotal}</Text>
                      </View>
                  </View>
                  <Text style={styles.sectionTitle}>Delivery Details</Text>
                  <TextInput style={styles.inputWhite} placeholder="Full Name" value={customerName} onChangeText={setCustomerName}/>
                  <TextInput style={styles.inputWhite} placeholder="Address" value={address} onChangeText={setAddress}/>
              </ScrollView>
              <View style={{padding:20, backgroundColor:'white'}}>
                  <TouchableOpacity onPress={placeOrder} style={styles.btnPrimary}>
                      <Text style={{color:'white', fontWeight:'bold', fontSize:16}}>PLACE ORDER (COD)</Text>
                  </TouchableOpacity>
              </View>
          </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loginContainer: { flex: 1, backgroundColor: '#1e1e2e', justifyContent: 'center' },
  loginBox: { backgroundColor: 'white', borderTopLeftRadius: 25, borderTopRightRadius: 25, padding: 30, position:'absolute', bottom:0, width:'100%', height:'45%' },
  logoBig: { fontSize: 40, fontWeight: '900', color: COLORS.secondary },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 15, borderRadius: 12, marginBottom: 20, fontSize: 18, backgroundColor:'#F9F9F9' },
  btnPrimary: { backgroundColor: COLORS.primary, padding: 16, borderRadius: 12, alignItems: 'center' },
  btnText: { color: 'white', fontWeight: 'bold', fontSize: 18 },
  header: { padding: 15, backgroundColor: 'white', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 2 },
  searchBar: { flexDirection:'row', backgroundColor:'#F4F6FB', padding:10, borderRadius:10, alignItems:'center', borderWidth:1, borderColor:'#E8E8E8' },
  banner: { width: width-40, height:160, borderRadius:12, marginRight:10 },
  sectionTitle: { fontSize: 16, fontWeight: '800', marginLeft: 15, marginBottom: 15, marginTop: 10, color: '#333' },
  catItem: { alignItems:'center', width: width/4.5, marginBottom:15 },
  catIcon: { width:60, height:60, backgroundColor:'#E8F5E9', borderRadius:30, justifyContent:'center', alignItems:'center' },
  prodCard: { backgroundColor: 'white', width: (width/2)-22, borderRadius: 12, padding: 10, marginBottom: 15, borderWidth: 1, borderColor: '#EEE' },
  prodImg: { width:'100%', height:90, resizeMode:'contain', marginBottom:10 },
  prodName: { fontWeight:'700', fontSize:13, color:'#333' },
  prodUnit: { fontSize:11, color:'#888', marginBottom:10 },
  prodRow: { flexDirection:'row', justifyContent:'space-between', alignItems:'center' },
  prodPrice: { fontSize:14, fontWeight:'900' },
  addBtn: { borderColor: COLORS.green, borderWidth:1, paddingHorizontal:15, paddingVertical:6, borderRadius:6, backgroundColor:'#F0FFF4' },
  qtyBox: { flexDirection:'row', backgroundColor: COLORS.green, borderRadius:6, alignItems:'center', paddingHorizontal:6, paddingVertical:4 },
  qtyText: { color:'white', fontWeight:'bold', paddingHorizontal:6 },
  floatBar: { position:'absolute', bottom:15, left:15, right:15, backgroundColor: COLORS.green, borderRadius: 12, flexDirection:'row', justifyContent:'space-between', padding:15, alignItems:'center', elevation:10 },
  cartCard: { backgroundColor:'white', borderRadius:12, padding:15, marginBottom:20 },
  cartItem: { flexDirection:'row', justifyContent:'space-between', paddingVertical:8 },
  inputWhite: { backgroundColor:'white', padding:15, borderRadius:12, marginBottom:10, borderWidth:1, borderColor:'#ddd' },
});