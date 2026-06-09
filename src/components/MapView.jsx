import React, { useEffect, useMemo, useState, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Custom icon for user location - Blue with GPS symbol
const userLocationIcon = L.divIcon({
  html: `
    <div class="marker-user-location">
      <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="5" fill="#3b82f6"></circle>
        <circle cx="12" cy="12" r="8" fill="none" stroke="#3b82f6"></circle>
        <path d="M12 2v4M12 18v4M22 12h-4M4 12H0M19.07 4.93l-2.83 2.83M7.76 16.24l-2.83 2.83M19.07 19.07l-2.83-2.83M7.76 7.76l-2.83-2.83" stroke="#3b82f6"></path>
      </svg>
      <div class="marker-pulse"></div>
    </div>
  `,
  className: 'user-marker-icon',
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -20]
})

// Custom icon for restaurant - Food/Fork & Knife symbol in orange
const restaurantIcon = L.divIcon({
  html: `
    <div class="marker-restaurant">
      <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor">
        <circle cx="12" cy="12" r="10" fill="#f97316"></circle>
        <text x="12" y="16" text-anchor="middle" font-size="16" font-weight="bold" fill="white">🍽</text>
      </svg>
    </div>
  `,
  className: 'restaurant-marker-icon',
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40]
})

function MapLongPress({ onLongPress }) {
  const [timeoutId, setTimeoutId] = useState(null)

  const clearExisting = () => {
    if (timeoutId) {
      window.clearTimeout(timeoutId)
      setTimeoutId(null)
    }
  }

  useMapEvents({
    mousedown(e) {
      const id = window.setTimeout(() => {
        setTimeoutId(null)
        onLongPress(e.latlng)
      }, 700)
      setTimeoutId(id)
    },
    mouseup: clearExisting,
    mousemove: clearExisting,
    dragstart: clearExisting,
    touchstart(e) {
      const id = window.setTimeout(() => {
        setTimeoutId(null)
        onLongPress(e.latlng)
      }, 700)
      setTimeoutId(id)
    },
    touchend: clearExisting,
    contextmenu(e) {
      e.originalEvent.preventDefault()
      onLongPress(e.latlng)
    }
  })

  return null
}

export default function MapView({ visiblePlaces, userPosition, sidebarOpen, addPlace }) {
  const [addPoint, setAddPoint] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    priceRange: '',
    category: '',
    menu: '',
    from: '10:00',
    to: '22:00',
    photo: null
  })
  const [previewUrl, setPreviewUrl] = useState(null)
  const nameRef = useRef(null)
  const mapRef = useRef(null)

  useEffect(() => {
    if (!formData.photo) {
      setPreviewUrl(null)
      return
    }

    const url = URL.createObjectURL(formData.photo)
    setPreviewUrl(url)

    return () => URL.revokeObjectURL(url)
  }, [formData.photo])

  useEffect(() => {
    if (addPoint && nameRef.current) {
      // give the form a small delay so overlay is visible
      setTimeout(() => nameRef.current && nameRef.current.focus(), 120)
    }
  }, [addPoint])

  useEffect(() => {
    if (!mapRef.current) return

    const resizeMap = () => {
      mapRef.current.invalidateSize({ reset: true })
    }

    const timeoutId = window.setTimeout(() => {
      resizeMap()
      window.requestAnimationFrame(resizeMap)
    }, 300)

    return () => window.clearTimeout(timeoutId)
  }, [sidebarOpen])

  const center = useMemo(() => {
    if (userPosition) return [userPosition.lat, userPosition.lng]
    return [-7.024, 110.444]
  }, [userPosition])

  const scrollToMapCenter = () => {
    if (!mapRef.current) return
    const zoom = mapRef.current.getZoom() || 14
    mapRef.current.setView(center, zoom, { animate: true })
    mapRef.current.invalidateSize()
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!addPoint || !formData.name || !formData.priceRange || !formData.category) {
      return
    }

    const newPlace = {
      id: `r${Date.now()}`,
      name: formData.name,
      lat: addPoint.lat,
      lng: addPoint.lng,
      priceRange: formData.priceRange,
      category: formData.category,
      menu: formData.menu
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
      operatingHours: {
        from: formData.from,
        to: formData.to
      },
      photos: previewUrl ? [previewUrl] : [],
      rating: 0
    }

    addPlace(newPlace)
    setAddPoint(null)
    setFormData({ name: '', priceRange: '', category: '', menu: '', from: '10:00', to: '22:00', photo: null })
  }

  return (
    <div className="map-wrapper">
      <MapContainer
        center={center}
        zoom={14}
        style={{ height: '100%', width: '100%' }}
        whenCreated={(map) => {
          mapRef.current = map
        }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {userPosition && (
          <Marker position={[userPosition.lat, userPosition.lng]} icon={userLocationIcon}>
            <Popup>Lokasi Anda</Popup>
          </Marker>
        )}

        {visiblePlaces.map((place) => (
          <Marker key={place.id} position={[place.lat, place.lng]} icon={restaurantIcon}>
            <Popup>
              <strong>{place.name}</strong>
              <div>Kategori: {place.category || 'Umum'}</div>
              <div>Harga: {place.priceRange}</div>
              <div>Jam: {place.operatingHours?.from} - {place.operatingHours?.to}</div>
              <div>Rating: {place.rating || 0} / 5</div>
              {place.photos && place.photos.length > 0 && (
                <img src={place.photos[0]} alt="menu" style={{ width: '100%', marginTop: 8, borderRadius: 8 }} />
              )}
            </Popup>
          </Marker>
        ))}

        <MapLongPress onLongPress={setAddPoint} />
      </MapContainer>

      <div className="map-hint">
        Tekan lama di peta untuk menambahkan tempat makan baru
      </div>

      <button
        type="button"
        className="map-scroll-button"
        onClick={scrollToMapCenter}
        title="Scroll ke tengah peta"
      >
        ⤵
      </button>

      {addPoint && (
        <div className="form-overlay">
          <div className="form-card">
            <h3>Tambah Tempat Makan</h3>
            <p>Tekan Submit setelah mengisi semua data. Koordinat lokasi sudah terisi otomatis.</p>
            <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>
              Koordinat: {addPoint.lat.toFixed(6)}, {addPoint.lng.toFixed(6)}
            </div>
            <form onSubmit={handleSubmit}>
              <label>
                Nama Tempat
                <input
                  ref={nameRef}
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Nama tempat makan"
                  required
                />
              </label>
              <label>
                Kategori
                <input
                  value={formData.category}
                  onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
                  placeholder="Contoh: Warung, Kedai"
                  required
                />
              </label>
              <label>
                Range Harga
                <input
                  value={formData.priceRange}
                  onChange={(e) => setFormData((prev) => ({ ...prev, priceRange: e.target.value }))}
                  placeholder="Rp15.000 - Rp40.000"
                  required
                />
              </label>
              <label>
                Menu (pisahkan pakai koma)
                <input
                  value={formData.menu}
                  onChange={(e) => setFormData((prev) => ({ ...prev, menu: e.target.value }))}
                  placeholder="Contoh: Nasi Goreng, Soto, Es Teh"
                  required
                />
              </label>
              <div className="time-row">
                <label>
                  Jam buka
                  <input
                    type="time"
                    value={formData.from}
                    onChange={(e) => setFormData((prev) => ({ ...prev, from: e.target.value }))}
                    required
                  />
                </label>
                <label>
                  Jam tutup
                  <input
                    type="time"
                    value={formData.to}
                    onChange={(e) => setFormData((prev) => ({ ...prev, to: e.target.value }))}
                    required
                  />
                </label>
              </div>
              <label>
                Gambar Menu
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFormData((prev) => ({ ...prev, photo: e.target.files?.[0] || null }))}
                />
              </label>
              {previewUrl && <img className="preview-image" src={previewUrl} alt="Preview menu" />}
              <div className="form-actions">
                <button type="button" className="cancel-button" onClick={() => setAddPoint(null)}>
                  Batal
                </button>
                <button type="submit" className="submit-button">
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
