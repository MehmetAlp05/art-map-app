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