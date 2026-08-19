import { useState, useEffect } from 'react';

function App() {
  const [menu, setMenu] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState('');
  
  // NEW: Cart State
  const [cart, setCart] = useState([]);

  // Admin Upload State
  const [selectedFile, setSelectedFile] = useState(null);
  const [restaurantInput, setRestaurantInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    fetchRestaurants();
  }, []);

  useEffect(() => {
    if (selectedRestaurantId) {
      fetchMenu(selectedRestaurantId);
      setCart([]); // Clear the cart if they switch restaurants!
    } else {
      setMenu([]);
    }
  }, [selectedRestaurantId]);

  const fetchRestaurants = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/restaurants');
      const data = await response.json();
      setRestaurants(data);
      if (data.length > 0 && !selectedRestaurantId) {
        setSelectedRestaurantId(data[0].id); 
      }
    } catch (error) {
      console.error("Error fetching restaurants:", error);
    }
  };

  const fetchMenu = async (restId) => {
    try {
      const response = await fetch(`http://localhost:3000/api/menu?restaurantId=${restId}`);
      const data = await response.json();
      setMenu(data);
    } catch (error) {
      console.error("Error fetching menu:", error);
    }
  };

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!restaurantInput.trim()) {
      setStatusMessage('Please enter a restaurant name first!');
      return;
    }
    if (!selectedFile) {
      setStatusMessage('Please select a menu image first!');
      return;
    }

    const formData = new FormData();
    formData.append('menuImage', selectedFile);
    formData.append('restaurantName', restaurantInput);

    setLoading(true);
    setStatusMessage(`AI is analyzing the menu for ${restaurantInput}...`);

    try {
      const response = await fetch('http://localhost:3000/api/scan-menu', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setStatusMessage('Menu successfully scanned and permanently saved!');
        setRestaurantInput('');
        setSelectedFile(null);
        await fetchRestaurants();
        setSelectedRestaurantId(data.restaurantId);
      } else {
        setStatusMessage('Failed to scan menu.');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      setStatusMessage('Error connecting to backend server.');
    } finally {
      setLoading(false);
    }
  };

  // NEW: Cart Functions
  const addToCart = (item) => {
    // We add a unique 'cartId' so we can delete duplicate items individually
    setCart([...cart, { ...item, cartId: Date.now() + Math.random() }]);
  };

  const removeFromCart = (cartIdToRemove) => {
    setCart(cart.filter(item => item.cartId !== cartIdToRemove));
  };

  // Calculate the total price of all items in the cart
  const cartTotal = cart.reduce((sum, item) => sum + item.price, 0);

  return (
    <div style={{ padding: '40px', fontFamily: 'sans-serif', backgroundColor: '#0f172a', color: '#e2e8f0', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <h1 style={{ color: '#38bdf8', fontSize: '3rem', textShadow: '0 0 15px rgba(56, 189, 248, 0.4)', margin: '0 0 10px 0', textAlign: 'center' }}>
        Futuristic LunchBot
      </h1>
      <h2 style={{ color: '#94a3b8', marginBottom: '30px', fontWeight: 'normal', textAlign: 'center' }}>Office Lunch Pre-Ordering Portal</h2>

      {/* Main Layout Area */}
      <div style={{ display: 'flex', gap: '40px', width: '100%', maxWidth: '1200px', flexWrap: 'wrap', justifyContent: 'center' }}>
        
        {/* Left Side: Admin & Menu */}
        <div style={{ flex: '1', minWidth: '300px', maxWidth: '800px' }}>
          
          {/* Admin Panel */}
          <div style={{ backgroundColor: '#1e293b', border: '1px dashed #38bdf8', padding: '20px', borderRadius: '15px', marginBottom: '30px' }}>
            <h3 style={{ color: '#38bdf8', marginTop: '0' }}>Admin: Add New Restaurant</h3>
            <input 
              type="text" 
              placeholder="Restaurant Name (e.g., Domino's)" 
              value={restaurantInput}
              onChange={(e) => setRestaurantInput(e.target.value)}
              style={{ width: '90%', padding: '10px', marginBottom: '15px', borderRadius: '8px', border: '1px solid #475569', backgroundColor: '#0f172a', color: '#f8fafc' }}
            />
            <br />
            <input type="file" accept="image/*" onChange={handleFileChange} style={{ color: '#e2e8f0', marginBottom: '15px' }} />
            <br />
            <button 
              onClick={handleUpload} 
              disabled={loading}
              style={{ backgroundColor: '#10b981', color: '#0f172a', padding: '10px 25px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem', width: '95%' }}
            >
              {loading ? 'Scanning with AI...' : 'Scan & Update Menu'}
            </button>
            {statusMessage && <p style={{ marginTop: '15px', color: '#fbbf24' }}>{statusMessage}</p>}
          </div>

          {/* Restaurant Selector */}
          {restaurants.length > 0 && (
            <div style={{ marginBottom: '30px', textAlign: 'center' }}>
              <label style={{ fontSize: '1.2rem', color: '#94a3b8', marginRight: '15px' }}>Choose Restaurant:</label>
              <select 
                value={selectedRestaurantId} 
                onChange={(e) => setSelectedRestaurantId(e.target.value)}
                style={{ padding: '10px', fontSize: '1.1rem', borderRadius: '8px', backgroundColor: '#1e293b', color: '#38bdf8', border: '1px solid #38bdf8', cursor: 'pointer' }}
              >
                {restaurants.map(rest => (
                  <option key={rest.id} value={rest.id}>{rest.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Menu Display */}
          {menu.length === 0 && restaurants.length === 0 && (
            <p style={{ color: '#94a3b8', fontSize: '1.2rem', textAlign: 'center' }}>No restaurants added yet. Upload a menu above!</p>
          )}

          <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {menu.map(item => (
              <div key={item.id} style={{ border: '1px solid #1e293b', padding: '20px', borderRadius: '15px', backgroundColor: '#1e293b', width: '220px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }}>
                <h3 style={{ fontSize: '1.2rem', margin: '0 0 10px 0', color: '#f8fafc' }}>{item.name}</h3>
                <p style={{ color: '#10b981', fontSize: '24px', fontWeight: 'bold', margin: '0 0 20px 0' }}>₹{item.price}</p>
                
                {/* NEW: Button now triggers addToCart */}
                <button 
                  onClick={() => addToCart(item)}
                  style={{ backgroundColor: '#38bdf8', color: '#0f172a', padding: '10px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', width: '100%' }}
                >
                  Add to Order
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* NEW: Right Side: The Order Cart */}
        <div style={{ flex: '0 0 350px', backgroundColor: '#1e293b', padding: '25px', borderRadius: '15px', height: 'fit-content', border: '1px solid #475569', position: 'sticky', top: '40px' }}>
          <h2 style={{ color: '#f8fafc', marginTop: '0', borderBottom: '1px solid #475569', paddingBottom: '15px' }}>Your Cart</h2>
          
          {cart.length === 0 ? (
            <p style={{ color: '#94a3b8', fontStyle: 'italic' }}>Your cart is empty. Add some food!</p>
          ) : (
            <>
              <div style={{ maxHeight: '400px', overflowY: 'auto', marginBottom: '20px' }}>
                {cart.map(item => (
                  <div key={item.cartId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0f172a', padding: '10px 15px', borderRadius: '8px', marginBottom: '10px' }}>
                    <div>
                      <div style={{ color: '#e2e8f0', fontWeight: 'bold' }}>{item.name}</div>
                      <div style={{ color: '#10b981' }}>₹{item.price}</div>
                    </div>
                    <button 
                      onClick={() => removeFromCart(item.cartId)}
                      style={{ backgroundColor: 'transparent', color: '#ef4444', border: 'none', cursor: 'pointer', fontSize: '1.2rem', padding: '5px' }}
                      title="Remove"
                    >
                      ✖
                    </button>
                  </div>
                ))}
              </div>
              
              <div style={{ borderTop: '2px dashed #475569', paddingTop: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#e2e8f0', fontSize: '1.2rem', fontWeight: 'bold' }}>Total:</span>
                <span style={{ color: '#10b981', fontSize: '1.5rem', fontWeight: 'bold' }}>₹{cartTotal}</span>
              </div>
              
              <button style={{ backgroundColor: '#10b981', color: '#0f172a', width: '100%', padding: '15px', marginTop: '20px', border: 'none', borderRadius: '8px', fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer' }}>
                Submit Order
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;