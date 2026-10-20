import { defineStore } from 'pinia'
import { searchCenterDefaults } from '@/scripts/config'

interface MapState {
  lat: number
  lon: number
  radiusKm: number
}

export const useMapStore = defineStore('map', {
  state: (): MapState => ({
    lat: searchCenterDefaults.latitude,
    lon: searchCenterDefaults.longitude,
    radiusKm: 200,
  }),
  actions: {
    setSearchCenter(lat: number, lon: number) {
      this.lat = lat
      this.lon = lon
    },
    setRadius(radiusKm: number) {
      this.radiusKm = radiusKm
    },
    resetSearchCenter() {
      this.lat = searchCenterDefaults.latitude
      this.lon = searchCenterDefaults.longitude
      this.radiusKm = 200
    }
  }
})