import { useState, useEffect } from 'react';

function App() {
  const [menu, setMenu] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  // Fetch the menu from the backend when the app loads
  useEffect(() => {
    fetchMenu();
  }, []);

  const fetchMenu = () => {
    fetch('http://localhost:3000/api/menu')
      .then(response => response.json())
      .then(data => setMenu(data));
  };

  // Handle file selection from user's computer/phone
  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  // Send the image to the backend for AI scanning
  const handleUpload = async () => {
    if (!selectedFile) {
      setStatusMessage('Please select a menu image first!');
      return;
    }

    const formData = new FormData();
    formData.append('menuImage', selectedFile);

    setLoading(true);
    setStatusMessage('AI is analyzing the menu image...');

    try {
      const response = await fetch('http://localhost:3000/api/scan-menu', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setMenu(data.menu);
        setStatusMessage('Menu successfully scanned and updated by AI!');
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

  return (
    <div style={{ padding: '40px', fontFamily: 'sans-serif', backgroundColor: '#0f172a', color: '#e2e8f0', minHeight: '100vh', textAlign: 'center' }}>
      <h1 style={{ color: '#38bdf8', fontSize: '3rem', textShadow: '0 0 15px rgba(56, 189, 248, 0.4)', margin: '0 0 10px 0' }}>
        Futuristic LunchBot
      </h1>
      <h2 style={{ color: '#94a3b8', marginBottom: '30px', fontWeight: 'normal' }}>Office Lunch Pre-Ordering Portal</h2>

      <div style={{ backgroundColor: '#1e293b', border: '1px dashed #38bdf8', padding: '20px', borderRadius: '15px', maxWidth: '500px', margin: '0 auto 40px auto' }}>
        <h3 style={{ color: '#38bdf8', marginTop: '0' }}>Admin: Upload New Menu Photo</h3>
        <input type="file" accept="image/*" onChange={handleFileChange} style={{ color: '#e2e8f0', marginBottom: '15px' }} />
        <br />
        <button 
          onClick={handleUpload} 
          disabled={loading}
          style={{ backgroundColor: '#10b981', color: '#0f172a', padding: '10px 25px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem' }}
        >
          {loading ? 'Scanning with AI...' : 'Scan & Update Menu'}
        </button>
        {statusMessage && <p style={{ marginTop: '15px', color: '#fbbf24' }}>{statusMessage}</p>}
      </div>

      <h2 style={{ color: '#94a3b8', marginBottom: '30px', fontWeight: 'normal' }}>Today's Available Menu:</h2>
      
      <div style={{ display: 'flex', gap: '25px', justifyContent: 'center', flexWrap: 'wrap' }}>
        {menu.map(item => (
          <div key={item.id} style={{ border: '1px solid #1e293b', padding: '25px', borderRadius: '15px', backgroundColor: '#1e293b', width: '260px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 0 20px rgba(56, 189, 248, 0.1)' }}>
            <h3 style={{ fontSize: '1.4rem', margin: '0 0 15px 0', color: '#f8fafc' }}>{item.name}</h3>
            <p style={{ color: '#10b981', fontSize: '28px', fontWeight: 'bold', margin: '0 0 25px 0', textShadow: '0 0 10px rgba(16, 185, 129, 0.3)' }}>
              ₹{item.price}
            </p>
            <button style={{ backgroundColor: '#38bdf8', color: '#0f172a', padding: '12px 20px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem', width: '100%' }}>
              Add to Order
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;