import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { supabase } from './supabaseClient';
import 'leaflet/dist/leaflet.css';

// Component to handle moving the map to your location
function RecenterMap({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.flyTo(position, 15);
  }, [position, map]);
  return null;
}

export default function ArtMap() {
  const [markers, setMarkers] = useState([]);
  const [myPos, setMyPos] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch pins on load
  useEffect(() => {
    const fetchMarkers = async () => {
      const { data } = await supabase.from('markers').select('*');
      if (data) setMarkers(data);
    };
    fetchMarkers();
  }, []);

  setLoading(true);

  // 1. Get Location First
  navigator.geolocation.getCurrentPosition(async (position) => {
    const lat = position.coords.latitude;
    const lng = position.coords.longitude;
    setMyPos([lat, lng]);

    // 2. Create the "Hidden" Camera Input
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    // THIS LINE FORCES THE CAMERA ON MOBILE:
    input.setAttribute('capture', 'environment'); 
    
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) { setLoading(false); return; }

      const fileName = `${Date.now()}-ART.jpg`;

      // 3. Upload and Save (Your existing Supabase logic)
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('art-photos')
        .upload(fileName, file);

      if (uploadData) {
        const publicUrl = supabase.storage.from('art-photos').getPublicUrl(fileName).data.publicUrl;
        await supabase.from('markers').insert([{ lat, lng, image_url: publicUrl }]);
        
        // Refresh markers or update state
        setMarkers(prev => [...prev, { lat, lng, image_url: publicUrl, id: Date.now() }]);
      }
      setLoading(false);
    };

    // Trigger the camera
    input.click();

  }, (err) => {
    alert("Please allow location access to post ART.");
    setLoading(false);
  }, { enableHighAccuracy: true });
};

  return (
    <div style={{ height: "90vh", position: "relative" }}>
      {/* 🟢 The "Post ART" Button */}


      <MapContainer center={[0, 0]} zoom={2} style={{ height: "100%" }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <RecenterMap position={myPos} />
        {markers.map(m => (
          <Marker key={m.id} position={[m.lat, m.lng]}>
            <Popup>
              <img src={m.image_url} alt="ART" style={{ width: '150px' }} />
              <p>ART was here</p>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
