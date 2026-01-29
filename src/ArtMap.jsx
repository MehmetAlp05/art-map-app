import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { supabase } from './supabaseClient';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// 1. Import the images directly so Vite bundles them
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import markerRetina from 'leaflet/dist/images/marker-icon-2x.png';

// 2. Create a new "Default Icon" object
const DefaultIcon = L.icon({
    iconUrl: markerIcon,
    iconRetinaUrl: markerRetina,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// 3. Force Leaflet to use this icon for all markers
L.Marker.prototype.options.icon = DefaultIcon;
// Component to handle moving the map to your location
function RecenterMap({ position }) {
  const map = useMap();

  useEffect(() => {
    if (position) {
      // .flyTo creates a smooth animation to the user's location
      map.flyTo(position, 15, {
        animate: true,
        duration: 1.5
      });
    }
  }, [position, map]);

  return null;
}

export default function ArtMap({ markers, userLocation }) {

  // Fetch pins on load
  useEffect(() => {
    const fetchMarkers = async () => {
      const { data } = await supabase.from('markers').select('*');
      if (data) setMarkers(data);
    };
    fetchMarkers();
  }, []);

  return (
    <div style={{ height: "100vh", width: "95vw", position: "relative" }}>
      {/* 🟢 The "Post ART" Button */}
      <MapContainer 
        center={userLocation || [0, 0]} 
        zoom={userLocation ? 15 : 2} 
        style={{ height: "100%", width: "95%", margin: "10px", borderRadius: '12px' }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        
        {/* 🚀 This component moves the map when userLocation is set */}
        <RecenterMap position={userLocation} />

        {markers.map(m => (
          <Marker key={m.id} position={[m.lat, m.lng]}>
            <Popup><img src={m.image_url} width="150" /></Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}