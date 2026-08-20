<script setup lang="ts">
import { onMounted, watch, onUnmounted } from 'vue'
import * as Cesium from 'cesium'
import { fromUrl } from 'geotiff'
import { useMapLayers } from '@/composables/useMapLayers'
import { overlayLayers } from '@/scripts/map/overlays'

const mapBiomasLayerMeta = overlayLayers.find(layer => layer.id === 'mapbiomas')

const { t, locale } = useI18n()

const props = withDefaults(defineProps<{
  viewer: Cesium.Viewer
  visible: boolean
  autoZoom?: boolean
}>(), {
  autoZoom: false
})

const { registerLayer } = useMapLayers()
let imageryLayer: Cesium.ImageryLayer | null = null
let tiffPromise: Promise<any> | null = null

// Helper to initialize and reuse the S3 COG connection
function getTiffReader(url: string) {
  if (!tiffPromise) {
    tiffPromise = fromUrl(url)
  }
  return tiffPromise
}

// Localized labels
const mapBiomasLabels: Record<string, { es: string; en: string }> = {
  '3': { es: '3. Bosque', en: '3. Forest' },
  '4': { es: '4. Sabana arbolada', en: '4. Wooded Savanna' },
  '5': { es: '5. Manglar', en: '5. Mangrove' },
  '6': { es: '6. Bosque inundable', en: '6. Flooded Forest' },
  '9': { es: '9. Plantación forestal', en: '9. Forest Plantation' },
  '11': { es: '11. Herbazal/Arbustal inundable', en: '11. Flooded Grassland/Shrubland' },
  '12': { es: '12. Sabanas/Herbazal', en: '12. Savanna/Grassland' },
  '13': { es: '13. Otras formaciones naturales no forestales', en: '13. Other Non-Forest Natural Formations' },
  '15': { es: '15. Uso pecuario/Tierras en descanso', en: '15. Pasture/Fallow Land' },
  '18': { es: '18. Uso agrícola/Tierras en descanso', en: '18. Agriculture/Fallow Land' },
  '21': { es: '21. Uso agropecuario/Tierras en descanso', en: '21. Agro-pastoral/Fallow Land' },
  '23': { es: '23. Playa o duna', en: '23. Beach or Dune' },
  '24': { es: '24. Uso urbano', en: '24. Urban Area' },
  '25': { es: '25. Otras áreas antrópica sin vegetación', en: '25. Other Non-Vegetated Anthropic Areas' },
  '27': { es: '27. No observado', en: '27. Not Observed' },
  '29': { es: '29. Afloramiento rocosos', en: '29. Rocky Outcrop' },
  '30': { es: '30. Uso minero', en: '30. Mining' },
  '31': { es: '31. Acuicultura', en: '31. Aquaculture' },
  '32': { es: '32. Planicie de marea hipersalina', en: '32. Hypersaline Tidal Flat' },
  '33': { es: '33. Río, lago u océano', en: '33. River, Lake or Ocean' },
  '34': { es: '34. Glaciar', en: '34. Glacier' },
  '50': { es: '50. Herbazal/Arbustal xerófilo', en: '50. Xerophytic Grassland/Shrubland' },
  '66': { es: '66. Arbustal', en: '66. Shrubland' },
  '68': { es: '68. Otras áreas natural sin vegetación', en: '68. Other Non-Vegetated Natural Areas' },
  '81': { es: '81. Vegetación herbácea y arbustiva andina', en: '81. Andean Herbaceous and Shrub Vegetation' },
  '82': { es: '82. Vegetación herbácea y arbustiva andina inundable', en: '82. Flooded Andean Herbaceous and Shrub Vegetation' }
}

// Register click query handler via composable against the S3 COG
const unregister = registerLayer(async (cartesian: Cesium.Cartesian3) => {
  if (!props.visible || !props.viewer || props.viewer.isDestroyed()) return null

  // Directly override the canvas element's inline cursor style
  const canvas = props.viewer.canvas
  canvas.style.cursor = 'progress'

  try {

    const cartographic = Cesium.Cartographic.fromCartesian(cartesian)
    const lon = Cesium.Math.toDegrees(cartographic.longitude)
    const lat = Cesium.Math.toDegrees(cartographic.latitude)

    const tiff = await getTiffReader(mapBiomasLayerMeta!.cogUrl!)
    const image = await tiff.getImage()

    const bbox = image.getBoundingBox() // [minX, minY, maxX, maxY]
    if (!bbox || lon < bbox[0] || lon > bbox[2] || lat < bbox[1] || lat > bbox[3]) {
      return null
    }

    const width = image.getWidth()
    const height = image.getHeight()

    // Map lon/lat to pixel coordinates
    const xFrac = (lon - bbox[0]) / (bbox[2] - bbox[0])
    const yFrac = (bbox[3] - lat) / (bbox[3] - bbox[1]) // inverted Y for raster rows

    const px = Math.floor(xFrac * width)
    const py = Math.floor(yFrac * height)

    if (px < 0 || px >= width || py < 0 || py >= height) return null

    // Read single pixel window directly from S3 COG via range request
    const rasterData = await image.readRasters({
      window: [px, py, px + 1, py + 1]
    })

    const classId = rasterData?.[0]?.[0]

    // Ignore invalid
    if (classId === undefined || classId === null || Number.isNaN(classId) || classId === 0) {
      return null
    }

    const stringId = String(Math.round(Number(classId)))
    const label = mapBiomasLabels[stringId] || { es: `Clase ${stringId}`, en: `Class ${stringId}` }

    const currentLang = locale.value
    return {
      title: mapBiomasLayerMeta ? t(mapBiomasLayerMeta.nameKey) : 'MapBiomas 2024',
      content: label[currentLang]
    }
  } catch (err) {
    console.error('Error querying S3 COG pixel:', err)
    return null
  } finally {
    // Clear the inline style so Cesium takes back normal cursor management
    canvas.style.cursor = ''
  }
})

onMounted(async () => {
  if (!props.viewer || props.viewer.isDestroyed()) return

  try {
    const provider = await Cesium.IonImageryProvider.fromAssetId(mapBiomasLayerMeta!.ionAssetId!)
    imageryLayer = props.viewer.imageryLayers.addImageryProvider(provider)
    imageryLayer.show = props.visible

    if (props.autoZoom && provider.rectangle) {
      props.viewer.camera.flyTo({ destination: provider.rectangle })
    }
  } catch (error) {
    console.error('Failed to initialize Cesium Ion Imagery Provider:', error)
  }
})

watch(() => props.visible, (newVal) => {
  if (imageryLayer) {
    imageryLayer.show = newVal
  }
})

onUnmounted(() => {
  unregister()
  if (imageryLayer && props.viewer && !props.viewer.isDestroyed()) {
    props.viewer.imageryLayers.remove(imageryLayer, true)
  }
})
</script>

<template></template>