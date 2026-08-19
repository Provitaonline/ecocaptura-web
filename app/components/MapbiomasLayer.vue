<script setup lang="ts">
import { onMounted, watch, onUnmounted } from 'vue'
import * as Cesium from 'cesium'
import TIFFImageryProvider from 'tiff-imagery-provider'
import { useMapLayers } from '@/composables/useMapLayers'

const props = withDefaults(defineProps<{
  viewer: Cesium.Viewer
  visible: boolean
  autoZoom?: boolean
}>(), {
  autoZoom: false
})

const { registerLayer } = useMapLayers()
let imageryLayer: Cesium.ImageryLayer | null = null
let tiffProvider: TIFFImageryProvider | null = null
let handler: Cesium.ScreenSpaceEventHandler | null = null

const COG_URL = 'https://ecocaptura-rasters.s3.us-east-2.amazonaws.com/MapBiomas_Venezuela_2024_cog.tif'

// 1. Localized labels
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

// 2. Palette matching array
const colorPalette = [
  { r: 31,  g: 141, b: 73,  classId: '3' },
  { r: 125, g: 201, b: 117, classId: '4' },
  { r: 4,   g: 56,  b: 29,  classId: '5' },
  { r: 2,   g: 105, b: 117, classId: '6' },
  { r: 122, g: 89,  b: 0,   classId: '9' },
  { r: 81,  g: 151, b: 153, classId: '11' },
  { r: 184, g: 175, b: 79,  classId: '12' },
  { r: 216, g: 159, b: 92,  classId: '13' },
  { r: 237, g: 222, b: 142, classId: '15' },
  { r: 233, g: 116, b: 237, classId: '18' },
  { r: 255, g: 239, b: 195, classId: '21' },
  { r: 255, g: 160, b: 122, classId: '23' },
  { r: 212, g: 39,  b: 30,  classId: '24' },
  { r: 219, g: 77,  b: 79,  classId: '25' },
  { r: 213, g: 213, b: 229, classId: '27' },
  { r: 255, g: 170, b: 95,  classId: '29' },
  { r: 156, g: 0,   b: 39,  classId: '30' },
  { r: 9,   g: 16,  b: 119, classId: '31' },
  { r: 252, g: 129, b: 20,  classId: '32' },
  { r: 37,  g: 50,  b: 228, classId: '33' },
  { r: 147, g: 223, b: 230, classId: '34' },
  { r: 173, g: 81,  b: 0,   classId: '50' },
  { r: 168, g: 147, b: 88,  classId: '66' },
  { r: 233, g: 122, b: 122, classId: '68' },
  { r: 223, g: 235, b: 98,  classId: '81' },
  { r: 111, g: 193, b: 121, classId: '82' }
]

// 3. Register click query handler via composable
const unregister = registerLayer(async (cartesian: Cesium.Cartesian3) => {
  if (!props.visible || !props.viewer || props.viewer.isDestroyed() || !tiffProvider) return null

  console.log('clicked')

  try {
    const cartographic = Cesium.Cartographic.fromCartesian(cartesian)
    const lon = Cesium.Math.toDegrees(cartographic.longitude)
    const lat = Cesium.Math.toDegrees(cartographic.latitude)

    const bbox = (tiffProvider as any).bbox // [minX, minY, maxX, maxY]
    const images = (tiffProvider as any)._images

    if (!bbox || !images || images.length === 0) {
      console.warn('Provider bbox or _images not available.')
      return null
    }

    // Check bounds
    if (lon < bbox[0] || lon > bbox[2] || lat < bbox[1] || lat > bbox[3]) {
      return null
    }

    const tiffImage = images[0]
    const width = tiffImage.getWidth ? tiffImage.getWidth() : tiffImage.width
    const height = tiffImage.getHeight ? tiffImage.getHeight() : tiffImage.height

    // Map lon/lat to pixel coordinates
    const xFrac = (lon - bbox[0]) / (bbox[2] - bbox[0])
    const yFrac = (bbox[3] - lat) / (bbox[3] - bbox[1]) // inverted Y for raster rows

    const px = Math.floor(xFrac * width)
    const py = Math.floor(yFrac * height)

    if (px < 0 || px >= width || py < 0 || py >= height) return null

    // Read single pixel window from the internal image
    const rasterData = await tiffImage.readRasters({
      window: [px, py, px + 1, py + 1]
    })

    const classId = rasterData?.[0]?.[0]

    if (classId === undefined || classId === null) return null

    const stringId = String(Math.round(Number(classId)))
    const label = mapBiomasLabels[stringId] || { es: `Clase ${stringId}`, en: `Class ${stringId}` }

    console.log('MapBiomas Category:', label.es)

    return {
      title: 'MapBiomas Venezuela 2024',
      content: label.es
    }
  } catch (err) {
    console.error('Error identifying TIFF value at position:', err)
    return null
  }
})

onMounted(async () => {
  if (!props.viewer || props.viewer.isDestroyed()) return

  try {
    tiffProvider = await TIFFImageryProvider.fromUrl(COG_URL, {
      renderOptions: {
        single: {
          type: 'discrete',
          useRealValue: true,
          domain: [3, 82],
          colors: colorPalette.map(c => [Number(c.classId), `rgb(${c.r}, ${c.g}, ${c.b})`] as [number, string])
        }
      }
    })

    console.log('TIFF Provider keys:', Object.keys(tiffProvider), Object.getOwnPropertyNames(Object.getPrototypeOf(tiffProvider)));

    imageryLayer = Cesium.ImageryLayer.fromProviderAsync(
      Promise.resolve(tiffProvider as unknown as Cesium.ImageryProvider)
    )
    
    props.viewer.imageryLayers.add(imageryLayer)
    imageryLayer.show = props.visible

    if (props.autoZoom && tiffProvider.rectangle) {
      props.viewer.camera.flyTo({ destination: tiffProvider.rectangle })
    }
  } catch (error) {
    console.error('Failed to initialize MapBiomas TIFFImageryProvider:', error)
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