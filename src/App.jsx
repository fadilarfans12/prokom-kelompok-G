import React, { useEffect, useState } from 'react'
import MapView from './components/MapView'

const TIME_LABELS = {
  all: 'Semua',
  morning: 'Pagi',
  noon: 'Siang',
  night: 'Malam'
}

const PRICE_LABELS = {
  all: 'Semua Harga',
  cheap: 'Murah 6-10k'
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

function parsePriceRange(range) {
  if (!range) return null
  // Expect formats like "Rp6.000 - Rp10.000" or "6000-10000"
  const parts = range
    .split('-')
    .map((part) => Number(part.replace(/[^0-9]/g, '').trim()))
  if (parts.length !== 2 || Number.isNaN(parts[0]) || Number.isNaN(parts[1])) return null
  return { min: parts[0], max: parts[1] }
}

function isPriceInRange(range, min, max) {
  const parsed = parsePriceRange(range)
  if (!parsed) return false
  return parsed.min <= max && parsed.max >= min
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
  const [priceFilter, setPriceFilter] = useState('cheap')
  const [maxBudget, setMaxBudget] = useState(50000)
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
    const timeOk = filter === 'all' ? true : isOpenAt(filter, place.operatingHours)
    // Check if place price max is within user's budget
    const priceRange = parsePriceRange(place.priceRange)
    const budgetOk = priceRange && priceRange.min <= maxBudget
    return timeOk && budgetOk
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
              <p className="price-prompt">
                Prompt: tampilkan menu makanan murah dengan harga Rp6.000–Rp10.000.
              </p>
            </div>
            <button
              className="sidebar-toggle"
              onClick={() => setSidebarOpen((open) => !open)}
              aria-label={sidebarOpen ? 'Tutup Sidebar' : 'Tampilkan Sidebar'}
              title={sidebarOpen ? 'Tutup Sidebar' : 'Tampilkan Sidebar'}
            >
              {sidebarOpen ? 'Tutup Sidebar' : 'Tampilkan Sidebar'}
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

          <div className="price-controls">
            {Object.keys(PRICE_LABELS).map((key) => (
              <button
                key={key}
                className={priceFilter === key ? 'active' : ''}
                onClick={() => setPriceFilter(key)}
              >
                {PRICE_LABELS[key]}
              </button>
            ))}
          </div>

          <div className="budget-controls">
            <label htmlFor="max-budget">
              Budget Maksimum:
              <input
                id="max-budget"
                type="number"
                min="0"
                step="5000"
                value={maxBudget}
                onChange={(e) => setMaxBudget(Number(e.target.value) || 0)}
                placeholder="Masukkan budget maksimum"
              />
            </label>
            <p className="budget-display">
              Rp {maxBudget.toLocaleString('id-ID')}
            </p>
          </div>

          <div className="restaurant-list">
            {filteredPlaces.length === 0 ? (
              <div className="empty-message-container">
                <p className="empty-message">
                  Tidak ada rekomendasi sesuai filter.
                </p>
                <p className="empty-hint">
                  {filter !== 'all' && maxBudget
                    ? `Coba naikkan budget atau ubah periode waktu.`
                    : `Coba ubah filter atau budget maksimum.`}
                </p>
              </div>
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

        {/** Overlay shown on small screens to allow closing sidebar by tapping outside */}
        <div
          className={`sidebar-overlay ${sidebarOpen ? 'visible' : ''}`}
          onClick={() => setSidebarOpen(false)}
          aria-hidden={!sidebarOpen}
        />

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
