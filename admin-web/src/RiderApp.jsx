// admin-web/src/RiderApp.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

function RiderApp({ onBack }) {
  const [orders, setOrders] = useState([]);
  
  // ⚠️ Ensure this matches your Server Port
  const API_URL = 'https://instahome.onrender.com';

  // Fetch only orders that are ready for pickup
  const fetchOrders = async () => {
    try {
      const res = await axios.get(`${API_URL}/orders`);
      // Riders only care about 'Accepted' (to pickup) or 'Out for Delivery' (to finish)
      const activeOrders = res.data.filter(o => o.status === 'Accepted' || o.status === 'Out for Delivery');
      setOrders(activeOrders);
    } catch (err) {
      console.error("Server offline?", err);
    }
  };

  // Poll for new jobs every 3 seconds
  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 3000);
    return () => clearInterval(interval);
  }, []);

  const updateStatus = async (id, status) => {
    await axios.post(`${API_URL}/update-status`, { orderId: id, status });
    fetchOrders(); // Refresh screen
  };

  return (
    <div style={{ padding: 20, background: '#111', minHeight: '100vh', color: 'white', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ margin: 0, color: '#4ade80' }}>🛵 Delivery Partner</h2>
        <button onClick={onBack} style={{ padding: '8px 15px', background: '#333', color: 'white', border: 'none', borderRadius: 5, cursor: 'pointer' }}>
          Exit
        </button>
      </div>

      {orders.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#666', marginTop: 50 }}>No active jobs. Waiting...</p>
      ) : (
        <div style={{ display: 'grid', gap: 20 }}>
          {orders.map(order => (
            <div key={order._id} style={{ background: '#222', padding: 20, borderRadius: 10, borderLeft: '5px solid #4ade80' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontWeight: 'bold' }}>#{order._id.slice(-4)}</span>
                <span style={{ background: '#4ade80', color: 'black', padding: '2px 8px', borderRadius: 4, fontSize: 12, fontWeight: 'bold' }}>
                  {order.status}
                </span>
              </div>
              <p style={{ margin: '5px 0', color: '#ddd' }}>📍 {order.address}</p>
              <p style={{ margin: '5px 0', color: '#888' }}>👤 {order.customerName}</p>
              <p style={{ margin: '5px 0', fontWeight: 'bold' }}>💰 ₹{order.totalAmount}</p>

              {/* RIDER ACTIONS */}
              {order.status === 'Accepted' && (
                <button 
                  onClick={() => updateStatus(order._id, 'Out for Delivery')}
                  style={{ width: '100%', marginTop: 15, padding: 12, background: '#3b82f6', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold' }}>
                  PICK UP ORDER
                </button>
              )}

              {order.status === 'Out for Delivery' && (
                <button 
                  onClick={() => updateStatus(order._id, 'Delivered')}
                  style={{ width: '100%', marginTop: 15, padding: 12, background: '#10b981', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold' }}>
                  MARK DELIVERED ✅
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default RiderApp;