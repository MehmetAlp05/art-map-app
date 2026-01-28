import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import ArtMap from './ArtMap';
import ArtFeed from './ArtFeed';

export default function App() {
  const [view, setView] = useState('map');
  const [markers, setMarkers] = useState([]);
  const [loading, setLoading] = useState(false);

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
  if (!navigator.geolocation) return alert("Enable GPS");
  
  setLoading(true);
  navigator.geolocation.getCurrentPosition(async (pos) => {
    const { latitude: lat, longitude: lng } = pos.coords;

    // 📍 NEW: Reverse Geocoding (Convert Lat/Lng to Address)
    let locationName = "Unknown Location";
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      );
      const data = await response.json();
      // We pick 'city' or 'town' or 'village'
      locationName = data.address.city || data.address.town || data.address.village || data.address.suburb || "ART Spot";
    } catch (error) {
      console.error("Geocoding failed", error);
    }

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.setAttribute('capture', 'environment');
    
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) { setLoading(false); return; }

      const fileName = `${Date.now()}-ART.jpg`;
      const { data: uploadData } = await supabase.storage.from('art-photos').upload(fileName, file);

      if (uploadData) {
        const publicUrl = supabase.storage.from('art-photos').getPublicUrl(fileName).data.publicUrl;
        
        // 💾 Save including the new location_name
        await supabase.from('markers').insert([
          { lat, lng, image_url: publicUrl, location_name: locationName }
        ]);
        
        await fetchMarkers(); 
      }
      setLoading(false);
    };
    input.click();
  }, () => setLoading(false), { enableHighAccuracy: true });
};

  return (
    <div style={{ height: "100vh", width: "100vw", display: "flex", flexDirection: "column" }}>
      
      {/* 🖼️ Dynamic Content View */}
      <main style={{ flex: 1, overflowY: "auto", position: "relative" }}>
        {view === 'map' ? <ArtMap markers={markers} /> : <ArtFeed markers={markers} />}
      </main>

      {/* 📱 Bottom Navigation Menu */}
      <nav style={navStyle}>
        <button onClick={() => setView('map')} style={view === 'map' ? activeTab : tab}>
          📍 Map
        </button>

        {/* 📸 The Central "Post" Button */}
        <button 
          onClick={handlePostArt}
          disabled={loading}
          style={{
            position: "absolute", bottom: "30px", left: "50%", transform: "translateX(-50%)",
            zIndex: 1000, padding: "15px 30px", backgroundColor: "#ff4444", color: "white",
            border: "none", borderRadius: "50px", fontWeight: "bold", fontSize: "16px",
            boxShadow: "0 4px 15px rgba(0,0,0,0.3)", cursor: "pointer"
          }}
        >
          {loading ? "POSTING..." : "📸 POST ART HERE"}
        </button>

        <button onClick={() => setView('feed')} style={view === 'feed' ? activeTab : tab}>
          📱 Feed
        </button>
      </nav>
    </div>
  );
}

// --- Styles ---
const navStyle = {
  height: '70px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-around',
  backgroundColor: '#fff',
  borderTop: '1px solid #eee',
  paddingBottom: 'env(safe-area-inset-bottom)' // Good for modern iPhones
};

const tab = { flex: 1, border: 'none', background: 'none', color: '#888', fontSize: '12px' };
const activeTab = { ...tab, color: '#000', fontWeight: 'bold' };

const postButtonStyle = {
  width: '55px',
  height: '55px',
  backgroundColor: '#ff4444',
  color: '#fff',
  border: 'none',
  borderRadius: '50%',
  fontSize: '30px',
  marginTop: '-30px', // Lifts the button slightly above the bar
  boxShadow: '0 4px 10px rgba(255, 68, 68, 0.4)',
  cursor: 'pointer'
};