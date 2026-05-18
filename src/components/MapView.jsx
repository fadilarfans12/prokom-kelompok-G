import React, { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

export default function MapView() {
  const [places, setPlaces] = useState([])

  useEffect(() => {
    fetch('/data/restaurants.json')
      .then((r) => r.json())
      .then((d) => setPlaces(d))
      .catch(() => setPlaces([]))
  }, [])

  return (
    <div className="map-wrapper">
      <MapContainer center={[-7.024, 110.444]} zoom={14} style={{ height: '70vh', width: '100%' }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {places.map((p) => (
          <Marker key={p.id} position={[p.lat, p.lng]}>
            <Popup>
              <strong>{p.name}</strong>
              <div>Harga: {p.priceRange}</div>
              {p.photos && p.photos.length > 0 && (
                <img src={p.photos[0]} alt="menu" style={{ width: '100%', marginTop: 6 }} />
              )}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
