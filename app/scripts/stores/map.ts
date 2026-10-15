// stores/map.ts
import { defineStore } from 'pinia'

interface MapState {
  lat: number | null
  lon: number | null
  radiusKm: number
}

export const useMapStore = defineStore('map', {
  state: (): MapState => ({
    lat: null,
    lon: null,
    radiusKm: 200, // default radius, e.g., 0 for point-only or preset km
  }),
  actions: {
    setSearchCenter(lat: number, lon: number) {
      this.lat = lat
      this.lon = lon
    },
    setRadius(radiusKm: number) {
      this.radiusKm = radiusKm
    },
    clearSearchCenter() {
      this.lat = null
      this.lon = null
      this.radiusKm = 200
    }
  }
})