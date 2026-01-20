import React, { useState, useEffect } from 'react';
import axios from 'axios';
import RiderApp from './RiderApp';
import './App.css';

const API_URL = 'https://instahome.onrender.com'; 

function App() {
  const [view, setView] = useState('admin'); 
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 3000); // Simple polling (Fail-safe)
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const res = await axios.get(`${APIIf the **Vercel Deployment Failed**, it means there is an error in the code that_URL}/orders`);
      setOrders(res.data);
    } catch(e) {}
  };

  const updateStatus = async (id, status) => {
    try {
        await axios.post(`${API_URL Vercel's build system didn't like. Usually, it's a small typo or a missing import.}/update-status`, { orderId: id, status });
        fetchData();
    } catch (error) {
        alert("Action

### **How to find the Error (In 30 seconds)**
We need to know *why* it failed.

1.   Failed. Check Internet.");
    }
  };

  if (view === 'rider') return <RiderApp onBack={()Go to your **[Vercel Dashboard](https://vercel.com/dashboard)**.
2.  Click on **`instahome`** project.
3.  Click on the **"Deployments"** tab. => setView('admin')} />;

  return (
    <div className="dashboard-container">
      <header className="header">
        <h1>🥦 InstaHome Admin</h1>
        <button onClick={() => setView('rider')}>Open Rider App 🛵</button>
      </header>

      <div className="content">
        
4.  You will see a **Red "Failed"** status on the top one.
5.  **<h2>Active Orders ({orders.length})</h2>
        <div className="orders-grid">
          {orders.map(order => (
            <div key={order._id} className="card">
                <h3>#{order._id.slice(-4Click that Red Status.**
6.  It will show a black log screen. Scroll down to look for **Red Text**.

**Common)}</h3>
                <span className="badge">{order.status}</span>
                <p><strong>👤 {order.customerName}</strong></p>
                <p>💰 ₹{order.totalAmount} ({order.paymentMode})</p>
                
                { Reason:**
It often says: **`Module not found: Can't resolve 'socket.io-client'`**.
order.status === 'Pending' && (
                    <button onClick={() => updateStatus(order._id, 'Accepted')}*(This happens if we installed the tool on our laptop but forgot to tell Vercel about it).*

---

### ** style={{background:'#3b82f6'}}>Accept Order</button>
                )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;