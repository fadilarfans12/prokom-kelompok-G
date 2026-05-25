import React, { useEffect, useMemo, useState } from 'react'
import MapView from './components/MapView'
import restaurantData from '../data/restaurants.json'

const UNDIP_POSITION = {
  lat: -7.0265,
  lng: 110.4389
}

<<<<<<< HEAD
const CATEGORY_OPTIONS = ['all', 'Warung', 'Kantin', 'Angkringan', 'Kafe']
const SORT_OPTIONS = [
  { value: 'recommended', label: 'Rekomendasi' },
  { value: 'terdekat', label: 'Terdekat' },
  { value: 'termurah', label: 'Termurah' },
  { value: 'rating', label: 'Rating Tertinggi' }
]

const PRICE_SLIDER_MIN = 5000
const PRICE_SLIDER_MAX = 50000

function parsePriceValue(raw) {
  return Number(raw.replace(/\D/g, '')) || 0
=======
const PRICE_LABELS = {
  all: 'Semua Harga',
  cheap: 'Murah 6-10k'
}

const TIME_WINDOWS = {
  morning: { min: 360, max: 660 },
  noon: { min: 660, max: 960 },
  night: { min: 960, max: 1320 }
>>>>>>> 511f4b8076aed806d131fdc82edfe36fe24157fb
}

function getPriceRange(priceRange) {
  if (!priceRange) return { min: 0, max: 0 }
  const [minRaw, maxRaw] = priceRange.split('-').map((part) => part.trim())
  return {
    min: parsePriceValue(minRaw),
    max: parsePriceValue(maxRaw)
  }
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

function distanceKm(lat1, lng1, lat2, lng2) {
  const toRad = (value) => (value * Math.PI) / 180
  const R = 6371
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function formatCurrency(value) {
  return value.toLocaleString('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  })
}

function parseTimeToMinutes(timeStr) {
  if (!timeStr) return 0
  const [h, m] = timeStr.split(':').map((x) => Number(x))
  return h * 60 + m
}

function isPlaceOpenAt(place, timeStr) {
  if (!place.operatingHours) return true
  const from = parseTimeToMinutes(place.operatingHours.from || '00:00')
  const to = parseTimeToMinutes(place.operatingHours.to || '23:59')
  const t = parseTimeToMinutes(timeStr)

  if (to >= from) {
    return t >= from && t <= to
  }

  // Overnight (e.g., 18:00 - 02:00)
  return t >= from || t <= to
}

export default function App() {
<<<<<<< HEAD
  const [places, setPlaces] = useState(restaurantData)
=======
  const [places, setPlaces] = useState([])
  const [filter, setFilter] = useState('all')
  const [priceFilter, setPriceFilter] = useState('cheap')
  const [maxBudget, setMaxBudget] = useState('50000')
>>>>>>> 511f4b8076aed806d131fdc82edfe36fe24157fb
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [category, setCategory] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [budgetMax, setBudgetMax] = useState(PRICE_SLIDER_MAX)
  const [sortBy, setSortBy] = useState('recommended')
  const [userPosition, setUserPosition] = useState(null)
  const [geoError, setGeoError] = useState('Menunggu izin lokasi...')
  const openedAt = useMemo(() => new Date(), [])

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

<<<<<<< HEAD
  const placesWithMeta = useMemo(
    () =>
      places.map((place) => {
        const price = getPriceRange(place.priceRange)
        const distance = Math.round(
          distanceKm(UNDIP_POSITION.lat, UNDIP_POSITION.lng, place.lat, place.lng) * 1000
        )
        return { ...place, price, distance }
      }),
    [places]
  )

  const currentTimeString = useMemo(() => {
    const d = openedAt
    const hh = String(d.getHours()).padStart(2, '0')
    const mm = String(d.getMinutes()).padStart(2, '0')
    return `${hh}:${mm}`
  }, [openedAt])

  const recommendedPlace = useMemo(() => {
    const openNow = placesWithMeta.filter((p) => isPlaceOpenAt(p, currentTimeString))
    if (openNow.length === 0) return null

    // Prefer higher rating, then closer distance
    openNow.sort((a, b) => {
      if ((b.rating || 0) !== (a.rating || 0)) return (b.rating || 0) - (a.rating || 0)
      return a.distance - b.distance
    })

    return openNow[0]
  }, [placesWithMeta, currentTimeString])

  const normalizedSearch = searchTerm.trim().toLowerCase()

  const filteredPlaces = useMemo(() => {
    return placesWithMeta
      .filter((place) => {
        const matchesCategory =
          category === 'all' || place.category.toLowerCase() === category.toLowerCase()
        const matchesBudget = place.price.min <= budgetMax
        const matchesSearch =
          normalizedSearch === '' ||
          place.name.toLowerCase().includes(normalizedSearch) ||
          (Array.isArray(place.menu) &&
            place.menu.some((menuItem) => menuItem.toLowerCase().includes(normalizedSearch)))

        return matchesCategory && matchesBudget && matchesSearch
      })
      .sort((a, b) => {
        if (sortBy === 'terdekat') {
          return a.distance - b.distance
        }
        if (sortBy === 'termurah') {
          return a.price.min - b.price.min
        }
        if (sortBy === 'rating') {
          return b.rating - a.rating
        }
        return b.rating - a.rating || a.distance - b.distance
      })
  }, [placesWithMeta, category, normalizedSearch, budgetMax, sortBy])
=======
  const numericBudget = Number(maxBudget)
  const filteredPlaces = places.filter((place) => {
    const timeOk = filter === 'all' ? true : isOpenAt(filter, place.operatingHours)
    const priceRange = parsePriceRange(place.priceRange)

    const priceFilterOk =
      priceFilter === 'all'
        ? true
        : priceRange && priceRange.max <= 10000

    const budgetOk =
      !maxBudget ||
      (priceRange && !Number.isNaN(numericBudget) && priceRange.max <= numericBudget)

    return timeOk && priceFilterOk && budgetOk
  })
>>>>>>> 511f4b8076aed806d131fdc82edfe36fe24157fb

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
        <h1>Rekomendasi Tempat Makan Tembalang</h1>
      </header>
      <div className="layout">
        <div className="sidebar-container">
          {!sidebarOpen && (
            <button
              className="floating-open"
              onClick={() => setSidebarOpen(true)}
              aria-label="Buka sidebar"
              title="Buka sidebar"
            >
              ☰
            </button>
          )}
          <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
            <div className="sidebar-top">
            <div>
              <h2>Filter & Cari</h2>
              <p className="sidebar-status">{geoError}</p>
              <p className="sidebar-hint">
                Filter berdasarkan kategori, budget, dan urutkan tempat makan.
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

          <div className="recommendation-card">
            <h3>Rekomendasi Sekarang</h3>
            <div className="recommendation-time">Waktu buka aplikasi: {currentTimeString}</div>
            {recommendedPlace ? (
              <div className="recommendation-body">
                <div className="rec-title">
                  <strong>{recommendedPlace.name}</strong>
                  <span className="rec-category">{recommendedPlace.category}</span>
                </div>
                <div className="rec-meta">Menu: {recommendedPlace.menu?.slice(0, 3).join(', ')}</div>
                <div className="rec-meta">Rating: {recommendedPlace.rating || 0} ★</div>
                <div className="rec-meta">
                  Jam buka: {recommendedPlace.operatingHours?.from} - {recommendedPlace.operatingHours?.to}
                </div>
                <div className="rec-actions">
                  <button
                    type="button"
                    className="rec-button"
                    onClick={() => {
                      setSearchTerm(recommendedPlace.name)
                      setSortBy('recommended')
                    }}
                  >
                    Cari di daftar
                  </button>
                  <button type="button" className="rec-button muted" onClick={() => setSidebarOpen(false)}>
                    Tutup sidebar
                  </button>
                </div>
              </div>
            ) : (
              <div className="recommendation-empty">Tidak ada rekomendasi terbuka sekarang.</div>
            )}
          </div>

          <div className="filter-section">
            <div className="search-box">
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari nama tempat atau menu"
              />
            </div>

            <div className="chip-group">
              {CATEGORY_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  className={`chip-button ${category === option ? 'active' : ''}`}
                  onClick={() => setCategory(option)}
                >
                  {option === 'all' ? 'Semua' : option}
                </button>
              ))}
            </div>

            <div className="budget-row">
              <div>
                <label>Budget maksimum</label>
                <strong>{formatCurrency(budgetMax)}</strong>
              </div>
              <input
                type="range"
                min={PRICE_SLIDER_MIN}
                max={PRICE_SLIDER_MAX}
                step={5000}
                value={budgetMax}
                onChange={(e) => setBudgetMax(Number(e.target.value))}
              />
            </div>

            <div className="sort-row">
              <label>Urutkan berdasarkan</label>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
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
                onChange={(e) => setMaxBudget(e.target.value)}
                placeholder="Masukkan budget maksimum"
              />
            </label>
            <p className="budget-display">
              {maxBudget ? `Rp ${Number(maxBudget).toLocaleString('id-ID')}` : 'Tidak ada batas'}
            </p>
          </div>

          <div className="restaurant-list">
            {filteredPlaces.length === 0 ? (
<<<<<<< HEAD
              <p className="empty-message">Tidak ada tempat makan dengan filter ini.</p>
=======
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
>>>>>>> 511f4b8076aed806d131fdc82edfe36fe24157fb
            ) : (
              filteredPlaces.map((place) => (
                <div key={place.id} className="restaurant-card">
                  <div className="restaurant-title">
                    <strong>{place.name}</strong>
                    <span>{place.category}</span>
                  </div>
                  <div className="restaurant-meta">Harga: {place.priceRange}</div>
                  <div className="restaurant-meta">
                    Menu: {Array.isArray(place.menu) ? place.menu.join(', ') : 'Tidak tersedia'}
                  </div>
                  <div className="restaurant-meta">
                    Jarak dari UNDIP: {place.distance} meter
                  </div>
                  <div className="restaurant-meta">
                    Jam buka: {place.operatingHours.from} - {place.operatingHours.to}
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
        </div>

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
            sidebarOpen={sidebarOpen}
            addPlace={handleAddPlace}
          />
        </main>
      </div>
    </div>
  )
}
