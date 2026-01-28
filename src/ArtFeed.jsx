// ArtFeed.jsx
export default function ArtFeed({ markers }) {
  return (
    <div style={{ padding: '10px', paddingBottom: '80px', backgroundColor: '#fff' }}>
      {markers.map((post) => (
        <div key={post.id} style={cardStyle}>
          <img src={post.image_url} alt="ART" style={imgStyle} />
          <div style={{ padding: '12px' }}>
            {/* Display the City/Town name here */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ fontSize: '18px' }}>📍</span>
              <span style={{ fontWeight: 'bold', fontSize: '14px', color: '#333' }}>
                {post.location_name || "Secret Location"}
              </span>
            </div>
            <p style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>
              {new Date(post.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

const cardStyle = {
  backgroundColor: 'white', borderRadius: '12px', marginBottom: '20px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)', overflow: 'hidden'
};
const imgStyle = { width: '100%', height: 'auto', display: 'block' };