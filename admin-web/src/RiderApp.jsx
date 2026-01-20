import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'https://instahome.onrender.com';

function RiderApp({ onBack }) {
  const [orders, setOrders] = useState([]);

  const fetchOrders = async () => {
    try {
      const res = await axios.get(`${API_URL}/orders`);
      const active = res.data.filter(o => o.status === 'Accepted' || o.status === 'Out for Delivery');
      setOrders(active);
    } catch (err) {}
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000); 
    return () => clearInterval(interval);
  }, []);

  const updateStatus = async (id, status) => {
    try {
        await axios.post(`${API_URL}/update-status`, { orderId: id, status });
        fetchOrders();
    } catch (error) {
        alert("Rider Action Failed: " + error.message);
    }
  };

  return (
    <div style={{padding:20, background:'#111', minHeight:'100vh', color:'white', fontFamily:'sans-serif'}}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20}}>
        <h2 style={{color:'#4ade80'}}>🛵 Delivery Partner</h2>
        <button onClick={onBack} style={{padding:'8px 15px', background:'#333', color:'white', border:'none', borderRadius:5}}>Exit</button>
      </div>

      {orders.length === 0 ? <p style={{textAlign:'center', color:'#666'}}>No jobs available.</p> : null}

      <div style={{display:'grid', gap:15}}>
          {orders.map(order => (
            <div key={order._id} style={{background:'#222', padding:20, borderRadius:10, borderLeft:'5px solid #4ade80'}}>
              <h3>Order #{order._id.slice(-4)}</h3>
              <p style={{color:'#ccc'}}>📍 {order.address}</p>
              <p style={{color:'#fff', fontWeight:'bold'}}>💰 Collect Cash: ₹{order.totalAmount}</p>
              
              {order.status === 'Accepted' && (
                <button onClick={() => updateStatus(order._id, 'Out for Delivery')} style={{width:'100%', padding:15, background:'#3b82f6', color:'white', border:'none', borderRadius:8, fontWeight:'bold', marginTop:10}}>
                  PICK UP ORDER
                </button>
              )}
              
              {order.status === 'Out for Delivery' && (
                <button onClick={() => updateStatus(order._id, 'Delivered')} style={{width:'100%', padding:15, background:'#10b981', color:'white', border:'none', borderRadius:8, fontWeight:'bold', marginTop:10}}>
                  CASH COLLECTED & DELIVERED ✅
                </button>
              )}
            </div>
          ))}
      </div>
    </div>
  );
}

export default RiderApp;