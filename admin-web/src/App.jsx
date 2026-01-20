import React, { useState, useEffect } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import RiderApp from './RiderApp';
import './App.css';

// ⚠️ ENSURE THIS IS HTTPS (Not HTTP)
const API_URL = 'https://instahome.onrender.com'; 

function App() {
  const [view, setView] = useState('admin'); 
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
    const socket = io(API_URL);
    socket.on('order_update', () => fetchData());
    return () => socket.disconnect();
  }, []);

  const fetchData = async () => {
    try {
      const res = await axios.get(`${API_URL}/orders`);
      setOrders(res.data);
    } catch(e) { console.error("Fetch Error:", e); }
  };

  const updateStatus = async (id, st) => {
    setLoading(true);
    try {
        console.log(`Updating ${id} to ${st}...`);
        const res = await axios.post(`${API_URL}/update-status`, { orderId: id, status: st });
        
        if (res.data.success) {
            // Success! Refresh data
            await fetchData();
        } else {
            alert("Server said No: " + JSON.stringify(res.data));
        }
    } catch (error) {
        // 🚨 THIS WILL TELL US THE PROBLEM
        alert("Update Failed: " + error.message);
        console.error(error);
    }
    setLoading(false);
  };

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
                <p>💰 ₹{order.totalAmount}</p>
                
                {order.status === 'Pending' && (
                    <button onClick={() => updateStatus(order._id, 'Accepted')} style={{background:'#3b82f6'}}>
                        {loading ? "..." : "Accept Order"}
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