import React, { useState, useEffect } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import RiderApp from './RiderApp';
import './App.css';

// ⚠️ FORCE CLOUD LINK
const API_URL = 'https://instahome.onrender.com'; 

function App() {
  const [view, setView] = useState('admin'); 
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);

  // --- LIVE DATA ENGINE ---
  useEffect(() => {
    fetchData();
    
    // Connect to Real-Time Updates
    const socket = io(API_URL);
    socket.on('order_update', () => {
        console.log("⚡ New Update!");
        fetchData(); // Refresh instantly
    });

    return () => socket.disconnect();
  }, []);

  const fetchData = async () => {
    try {
      const o = await axios.get(`${API_URL}/orders`);
      setOrders(o.data);
      const p = await axios.get(`${API_URL}/products`);
      setProducts(p.data);
    } catch(e) { console.error("Server Sleeping?"); }
  };

  const updateStatus = async (id, st) => {
    await axios.post(`${API_URL}/update-status`, { orderId: id, status: st });
    fetchData(); // Optimistic update
  };

  // --- RIDER SWITCH ---
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
                <div style={{display:'flex', justifyContent:'space-between'}}>
                    <h3>#{order._id.slice(-4)}</h3>
                    <span style={{
                        padding:'4px 8px', borderRadius:'4px', fontWeight:'bold', fontSize:'12px',
                        background: order.status==='Pending'?'#fff7ed': order.status==='Delivered'?'#dcfce7':'#e0f2fe',
                        color: order.status==='Pending'?'#c2410c': order.status==='Delivered'?'#166534':'#0369a1'
                    }}>{order.status}</span>
                </div>
                <p><strong>👤 {order.customerName}</strong></p>
                <p>📍 {order.address}</p>
                <p>💰 ₹{order.totalAmount} ({order.paymentMode})</p>
                
                <div style={{margin:'10px 0', borderTop:'1px solid #eee', paddingTop:'10px'}}>
                    {order.items.map((i, idx) => (
                        <div key={idx} style={{display:'flex', justifyContent:'space-between', fontSize:'13px', color:'#666'}}>
                            <span>{i.qty} x {i.name}</span>
                            <span>₹{i.price * i.qty}</span>
                        </div>
                    ))}
                </div>

                {order.status === 'Pending' && (
                    <button onClick={() => updateStatus(order._id, 'Accepted')} style={{background:'#3b82f6'}}>Accept Order</button>
                )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;