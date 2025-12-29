// admin-web/src/App.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import RiderApp from './RiderApp';
import './App.css';

function App() {
  const [view, setView] = useState('admin'); // 'admin' or 'rider'
  
  // --- ADMIN LOGIC ---
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const API_URL = 'http://localhost:5000';

  const fetchData = async () => {
    try {
      const ordersRes = await axios.get(`${API_URL}/orders`);
      setOrders(ordersRes.data);
      const productsRes = await axios.get(`${API_URL}/products`);
      setProducts(productsRes.data);
    } catch (error) { console.log("Connecting..."); }
  };

  useEffect(() => {
    if (view === 'admin') {
      fetchData();
      const interval = setInterval(fetchData, 3000);
      return () => clearInterval(interval);
    }
  }, [view]);

  const updateStatus = async (id, status) => {
    await axios.post(`${API_URL}/update-status`, { orderId: id, status });
    fetchData();
  };

  // --- RIDER SWITCH ---
  if (view === 'rider') {
    return <RiderApp onBack={() => setView('admin')} />;
  }

  // --- ADMIN DASHBOARD UI ---
  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="header" style={{display:'flex', justifyContent:'space-between', padding:'15px 30px', background:'#2c0e3a', color:'white'}}>
        <h1>🥦 InstaHome Admin</h1>
        <button 
            onClick={() => setView('rider')}
            style={{background:'#10b981', border:'none', padding:'10px 20px', color:'white', fontWeight:'bold', cursor:'pointer', borderRadius:'5px'}}>
            Open Rider App 🛵
        </button>
      </header>

      <div className="content" style={{padding: 30}}>
        <h2>Live Orders ({orders.length})</h2>
        <div className="orders-grid" style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:20}}>
          {orders.map(order => (
            <div key={order._id} className="card" style={{background:'white', padding:20, borderRadius:10, boxShadow:'0 2px 5px rgba(0,0,0,0.1)', borderLeft: `5px solid ${order.status === 'Pending' ? 'orange' : order.status === 'Accepted' ? 'blue' : 'green'}`}}>
              <div style={{display:'flex', justifyContent:'space-between', marginBottom:10}}>
                <strong>#{order._id.slice(-4)}</strong>
                <span style={{background:'#eee', padding:'2px 8px', borderRadius:4, fontSize:12}}>{order.status}</span>
              </div>
              <h3>{order.customerName}</h3>
              <p>{order.items.length} Items - ₹{order.totalAmount}</p>
              
              {order.status === 'Pending' && (
                  <button onClick={() => updateStatus(order._id, 'Accepted')} style={{width:'100%', padding:10, marginTop:10, background:'#3b82f6', color:'white', border:'none', cursor:'pointer', borderRadius:5}}>
                      Accept Order
                  </button>
              )}
              {order.status !== 'Pending' && <p style={{color:'green', marginTop:10, fontWeight:'bold'}}>Processing...</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;