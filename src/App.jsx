import React from 'react'
import MapView from './components/MapView'

export default function App() {
  return (
    <div className="app">
      <header className="header">
        <h1>Tempat Makan Tembalang</h1>
      </header>
      <main>
        <section className="controls">
          <div className="rec-buttons">
            <button>Pagi</button>
            <button>Siang</button>
            <button>Malam</button>
          </div>
        </section>
        <MapView />
      </main>
    </div>
  )
}
