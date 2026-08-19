import { ref } from 'vue'
import * as Cesium from 'cesium'

export type LayerQueryHandler = (
  cartesian: Cesium.Cartesian3, 
  cartographic: Cesium.Cartographic, 
  screenPosition: Cesium.Cartesian2
) => Promise<any>

const registeredLayers = ref<LayerQueryHandler[]>([])

export function useMapLayers() {
  function registerLayer(handler: LayerQueryHandler) {
    registeredLayers.value.push(handler)
    return () => {
      registeredLayers.value = registeredLayers.value.filter(h => h !== handler)
    }
  }

  async function queryAllLayers(
    cartesian: Cesium.Cartesian3, 
    cartographic: Cesium.Cartographic, 
    screenPosition: Cesium.Cartesian2
  ) {
    const results = await Promise.all(
      registeredLayers.value.map(handler => handler(cartesian, cartographic, screenPosition))
    )
    return results.filter(Boolean)
  }

  return { registerLayer, queryAllLayers }
}