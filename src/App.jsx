import React, { useEffect, useState } from 'react'
import MapView from './components/MapView'

const TIME_LABELS = {
  all: 'Semua',
  morning: 'Pagi',
  noon: 'Siang',
  night: 'Malam'
}

const TIME_WINDOWS = {
  morning: { min: 360, max: 660 },
  noon: { min: 660, max: 960 },
  night: { min: 960, max: 1320 }
}

function parseMinutes(time) {
  const [hour, minute] = time.split(':').map(Number)
  return hour * 60 + minute
}

function isOpenAt(period, hours) {
  if (!hours || !hours.from || !hours.to) return false
  const time = parseMinutes(hours.from)
  const end = parseMinutes(hours.to)
  const { min, max } = TIME_WINDOWS[period]
  return time <= max && end >= min
}

function distanceKm(lat1, lng1, lat2, lng2) {
  const toRad = (value) => (value * Math.PI) / 180
  const R = 6371
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return (R * c).toFixed(2)
}

function getCurrentPeriod() {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 11) return 'morning'
  if (hour >= 11 && hour < 15) return 'noon'
  if (hour >= 15 && hour < 22) return 'night'
  return 'all'
}

export default function App() {
  const [places, setPlaces] = useState([])
  const [filter, setFilter] = useState('all')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [userPosition, setUserPosition] = useState(null)
  const [geoError, setGeoError] = useState('Menunggu izin lokasi...')
  const [recommendation, setRecommendation] = useState('')

  useEffect(() => {
    fetch('/data/restaurants.json')
      .then((response) => response.json())
      .then((data) => setPlaces(data))
      .catch(() => setPlaces([]))
  }, [])

  useEffect(() => {
    const period = getCurrentPeriod()
    setFilter(period)
    setRecommendation(TIME_LABELS[period])
  }, [])

  useEffect(() => {
    if (!navigator.geolocation) {
      setGeoError('GPS tidak tersedia di browser ini.')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserPosition({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        })
        setGeoError('GPS aktif')
      },
      () => {
        setGeoError('Tidak dapat mengambil lokasi. Izinkan akses GPS.')
      }
    )
  }, [])

  const filteredPlaces = places.filter((place) => {
    if (filter === 'all') return true
    return isOpenAt(filter, place.operatingHours)
  })

  const handleRating = (id, rating) => {
    setPlaces((current) =>
      current.map((place) => (place.id === id ? { ...place, rating } : place))
    )
  }

  const handleAddPlace = (newPlace) => {
    setPlaces((current) => [newPlace, ...current])
  }

  return (
    <div className="app">
      <header className="header">
        <h1>Tempat Makan Tembalang</h1>
      </header>
      <div className="layout">
        <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
          <div className="sidebar-top">
            <div>
              <h2>Menu</h2>
              <p className="sidebar-status">{geoError}</p>
              <p className="recommendation-text">
                Rekomendasi otomatis: {recommendation || TIME_LABELS.all}
              </p>
            </div>
            <button className="sidebar-toggle" onClick={() => setSidebarOpen((open) => !open)}>
              {sidebarOpen ? 'Hide' : 'Show'}
            </button>
          </div>

          <div className="period-controls">
            {Object.keys(TIME_LABELS).map((key) => (
              <button
                key={key}
                className={filter === key ? 'active' : ''}
                onClick={() => setFilter(key)}
              >
                {TIME_LABELS[key]}
              </button>
            ))}
          </div>

          <div className="restaurant-list">
            {filteredPlaces.length === 0 ? (
              <p className="empty-message">Tidak ada tempat makan untuk periode ini.</p>
            ) : (
              filteredPlaces.map((place) => (
                <div key={place.id} className="restaurant-card">
                  <div className="restaurant-title">
                    <strong>{place.name}</strong>
                    <span>{place.category || 'Umum'}</span>
                  </div>
                  <div className="restaurant-meta">{place.priceRange}</div>
                  <div className="restaurant-meta">
                    Jam buka: {place.operatingHours?.from} - {place.operatingHours?.to}
                  </div>
                  <div className="restaurant-meta">
                    Jarak:{' '}
                    {userPosition
                      ? `${distanceKm(userPosition.lat, userPosition.lng, place.lat, place.lng)} km`
                      : 'GPS belum tersedia'}
                  </div>
                  <div className="rating-row">
                    <span>Rating:</span>
                    {[1, 2, 3, 4, 5].map((value) => (
                      <button
                        key={value}
                        type="button"
                        className={place.rating >= value ? 'star active' : 'star'}
                        onClick={() => handleRating(place.id, value)}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>

        <main className="main-content">
          <MapView
            visiblePlaces={filteredPlaces}
            userPosition={userPosition}
            addPlace={handleAddPlace}
          />
        </main>
      </div>
    </div>
  )
}
