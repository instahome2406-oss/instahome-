import React, { useState, useEffect } from 'react';
import axios from 'axios';
import RiderApp from './RiderApp';
import './App.css';

// ⚠️ YOUR CLOUD SERVER
const API_URL = 'https://instahome.onrender.com'; 

function App() {
  const [view, setView] = useState('admin'); 
  const [orders, setOrders] = useState([]);

  // Auto-Refresh every 2 seconds (Safe & Reliable)
  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 2000);
    return () => clearInterval(interval);
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await axios.get(`${API_URL}/orders`);
      setOrders(res.data);
    } catch(e) { console.error("Loading..."); }
  };

  const updateStatus = async (id, status) => {
    try {
        // Optimistic Update (Change UI immediately)
        setOrders(orders.map(o => o._id === id ? { ...o, status: status } : o));
        
        await axios.post(`${API_URL}/update-status`, { orderId: id, status });
        fetchOrders(); 
    } catch (error) {
        alert("Action Failed. Check Connection.");
    }
  };

  // Switch to Rider Mode
  if (view === 'rider') return <RiderApp onBack={() => setView('admin')} />;

  return (
    <div className="dashboard-container">
      <header className="header">
        <h1>🥦 InstaHome Admin</h1>
        <button onClick={() => setView('rider')}>Open Rider App 🛵</button>
      </header>

      <div className="content">
        <h2>Active Orders ({orders.length})</h2>
        <div className="orders-grid">
          {orders.map(order => (
            <div key={order._id} className="card">
                <div style={{display:'flex', justifyContent:'space-between', marginBottom:'10px'}}>
                    <h3>#{order._id.slice(-4)}</h3>
                    <span style={{
                        padding:'5px 10px', borderRadius:'5px', fontWeight:'bold', fontSize:'12px',
                        backgroundColor: order.status==='Pending'?'#FFF3E0': order.status==='Delivered'?'#E8F5E9':'#E3F2FD',
                        color: order.status==='Pending'?'#E65100': order.status==='Delivered'?'#2E7D32':'#1565C0'
                    }}>{order.status}</span>
                </div>
                
                <p><strong>👤 {order.customerName}</strong></p>
                <p>📍 {order.address}</p>
                <p>📞 {order.phone || "No Phone"}</p>
                <div style={{borderTop:'1px solid #eee', margin:'10px 0', paddingTop:'10px'}}>
                    <p style={{fontWeight:'bold'}}>Items:</p>
                    {order.items.map((item, i) => (
                        <div key={i} style={{display:'flex', justifyContent:'space-between', fontSize:'14px', color:'#555'}}>
                            <span>{item.qty} x {item.name}</span>
                            <span>₹{item.price * item.qty}</span>
                        </div>
                    ))}
                </div>
                <p style={{textAlign:'right', fontSize:'18px', fontWeight:'bold'}}>Total: ₹{order.totalAmount}</p>
                
                {order.status === 'Pending' && (
                    <button onClick={() => updateStatus(order._id, 'Accepted')} style={{background:'#4F46E5'}}>
                        Accept Order
                    </button>
                )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;