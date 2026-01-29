import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import ArtMap from './ArtMap';
import ArtFeed from './ArtFeed';
import './App.css';

export default function App() {
  const [view, setView] = useState('feed');
  const [markers, setMarkers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [myPos, setMyPos] = useState(null); // Track user location globally 
  // Get location once when the app starts
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setMyPos([pos.coords.latitude, pos.coords.longitude]),
        (err) => console.log("Location access denied"),
        { enableHighAccuracy: true }
      );
    }
    fetchMarkers();
  }, []);
  // Load posts
  const fetchMarkers = async () => {
    const { data } = await supabase
      .from('markers')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setMarkers(data);
  };

  useEffect(() => { fetchMarkers(); }, []);

  // The Post Logic (Now inside App.jsx so the button can trigger it)
const handlePostArt = () => {
  // 1. Immediately create the camera input (No waiting!)
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.setAttribute('capture', 'environment');

  // 2. Define what happens AFTER the photo is taken
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);

    // 3. NOW get the location while the user thinks the app is just "processing"
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude: lat, longitude: lng } = pos.coords;

      try {
        // Reverse Geocode (Optional, but good for your feed!)
        const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
        const geoData = await geoRes.json();
        const locationName = geoData.address.city || geoData.address.town || "ART Spot";

        const fileName = `art-${Date.now()}.jpg`;
        
        // Upload to Supabase
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('art-photos')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const publicUrl = supabase.storage.from('art-photos').getPublicUrl(fileName).data.publicUrl;

        // Save to Database
        await supabase.from('markers').insert([
          { lat, lng, image_url: publicUrl, location_name: locationName }
        ]);

        await fetchMarkers(); // Refresh the feed/map
        alert("ART Posted!");
      } catch (err) {
        alert("Error: " + err.message);
      } finally {
        setLoading(false);
      }
    }, (err) => {
      alert("Location required to post ART.");
      setLoading(false);
    }, { enableHighAccuracy: true });
  };

  // 4. Trigger the camera prompt IMMEDIATELY on button click
  input.click();
};

  return (
    <div style={{ height: "97vh", width: "97vw", display: "flex", flexDirection: "column",fontFamily: 'Helvetica, sans-serif' }}>
      <div style={headerStyle}>
        🏺 ART Was Here 🏛️
      </div>
      {/* 🖼️ Dynamic Content View */}
      <main style={{ flex: 1,
                    overflowY: "auto",
                    position: "relative",
                    marginTop: 'calc(7vh + env(safe-area-inset-top))', // Pushes content down so header doesn't cover it
                    marginBottom: '80px',
                    borderRadius: '12px'
                    }}>
        {view === 'map' ? <ArtMap markers={markers} userLocation={myPos} /> : <ArtFeed markers={markers} />}
      </main>

      {/* 📱 Bottom Navigation Menu */}
      <div style={navStyle}>

        <button onClick={() => setView('feed')} style={view === 'feed' ? activeTab : tab}>
          🏠
        </button>
        {/* 📸 The Central "Post" Button */}
        <button 
          onClick={handlePostArt}
          disabled={loading}
          style={{
            
            zIndex: 1000, padding: "15px 20px", backgroundColor: "#8ccccc", color: "black",
            border: "none", borderRadius: "50px", fontWeight: "bold", fontSize: "30px",
            boxShadow: "0 4px 15px rgba(0,0,0,0.3)", cursor: "pointer"
          }}
        >
          {loading ? "POSTING..." : "📸"}
        </button>
        <button onClick={() => setView('map')} style={view === 'map' ? activeTab : tab}>
          📍
        </button>
        
      </div>
    </div>
  );
}

// --- Styles ---
const navStyle = {
  position: 'fixed',
  bottom: 0,
  left: 0,
  right: 0,
  height: 'auto', // Let padding handle the height
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-around',
  backgroundColor: '#02735E',

  zIndex: 2000,
  // 📱 This is the magic line for Safari
  paddingBottom: 'calc(env(safe-area-inset-bottom) + 10px)', 
  paddingTop: '10px',
  margin: '10px',
  borderRadius: '12px',

};
const headerStyle = {
  position: 'fixed', // Pin it to the top
  top: 0,
  left: 0,
  right: 0,
  height: '7vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '24px',
  fontWeight: 'bold',
  color: 'black',
  color: 'white',
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  zIndex: 3000, // Higher than the map and nav
  paddingTop: 'env(safe-area-inset-top)', // Support for iPhone "Dynamic Island" / Notch
  borderRadius: '12px 12px 12px 12px',
  backgroundColor: '#02735E',
  margin: '10px'
};
const tab = { flex: 1, border: 'none', background: 'none', color: '#b9b9b9', fontSize: '30px' };
const activeTab = { ...tab, color: '#ffffff', fontWeight: 'bold' };

