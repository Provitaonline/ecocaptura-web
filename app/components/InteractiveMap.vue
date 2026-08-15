<template>
  <div class="map-grid-map map-touch-wrapper">
    <div id="mapRoot" style="position: relative;">
      
        <div id="cesiumContainer"></div>

        <AreaOfInterestBoundary :autoZoom="false" :viewer="viewer" :visible="overlayStates['aoi'] ?? true" v-if="viewer"/>

        <div class="map-top map-right" v-if="viewer">
            <NorthArrowControl :viewer="viewer" />
            <ZoomControl :viewer="viewer" />
            <LookDownControl :viewer="viewer" />
            <ResetViewControl :viewer="viewer" />
            <LayerControl :viewer="viewer" @update:overlay="handleOverlayUpdate" />
            <ResetViewControl :viewer="viewer" />
        </div>

    </div>
  </div>
</template>

<style scoped>
.map-grid-map {
    height: 100%;
    min-height: 0;
    position: relative;
}

#mapRoot {
    position: relative;
    height: 100%;
    width: 100%;
}

#cesiumContainer {
    position: absolute;
    inset: 0;
    overflow: hidden;
}
</style>

<script setup lang="ts">
import '@/assets/css/map.css'
import { onMounted, ref, onBeforeUnmount, watch } from 'vue'
import { 
  Ion, 
  Terrain, 
  Viewer, 
  Cartesian3, 
  HeightReference, 
  VerticalOrigin, 
  Math as CesiumMath, 
  HeadingPitchRange, 
  BoundingSphere,
  HeadingPitchRoll,
  Transforms,
  PerspectiveFrustum,
  FrustumGeometry,
  GeometryInstance,
  Primitive,
  PerInstanceColorAppearance,
  ColorGeometryInstanceAttribute,
  Color,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
  sampleTerrainMostDetailed,
  Cartographic,
  Ellipsoid,
  defined
} from 'cesium'
import 'cesium/Build/Cesium/Widgets/widgets.css'
import ZoomControl from './mapControls/ZoomControl.vue'
import NorthArrowControl from './mapControls/NorthArrowControl.vue'
import LookDownControl from './mapControls/LookDownControl.vue'
import AreaOfInterestBoundary from './AreaOfInterestBoundary.vue'
import LayerControl from './mapControls/LayerControl.vue'
import ResetViewControl from './mapControls/ResetViewControl.vue'
import { MAP_CONFIG } from '@/scripts/config'
import { reactive } from 'vue'
import { overlayLayers } from '@/scripts/map/overlays'

declare global {
  interface Window {
    CESIUM_BASE_URL: string
  }
}

const config = useRuntimeConfig()

window.CESIUM_BASE_URL = '/cesium/'
Ion.defaultAccessToken = config.public.cesiumIonToken

const props = defineProps<{
  captures?: any[]
}>()

const emit = defineEmits<{
  (e: 'open-lightbox', payload: { captureId: string; id: string }): void
}>()

const viewer = ref<Viewer | null>(null)
let handler: ScreenSpaceEventHandler | null = null

const overlayStates = reactive<Record<string, boolean>>(
  Object.fromEntries(overlayLayers.map(layer => [layer.id, layer.defaultVisible]))
)

function handleOverlayUpdate(id: string, visible: boolean) {
  overlayStates[id] = visible
}

onMounted(() => {
    viewer.value = new Viewer('cesiumContainer', {
        baseLayerPicker: false,
        animation: false,
        fullscreenButton: false,
        geocoder: false,
        homeButton: false,
        infoBox: false,
        sceneModePicker: false,
        selectionIndicator: false,
        timeline: false,
        navigationHelpButton: false,
        navigationInstructionsInitiallyVisible: false,
        scene3DOnly: true,
        terrain: Terrain.fromWorldTerrain(),
        // @ts-ignore
        terrainExaggeration: 2
    })

    viewer.value.scene.globe.depthTestAgainstTerrain = true

    viewer.value.camera.setView({
        destination: Cartesian3.fromDegrees(
            MAP_CONFIG.defaultView.destination.longitude,
            MAP_CONFIG.defaultView.destination.latitude,
            MAP_CONFIG.defaultView.destination.height
        ),
        orientation: MAP_CONFIG.defaultView.orientation
    })

    ;(window as any).viewer = viewer.value

    handler = new ScreenSpaceEventHandler(viewer.value.scene.canvas)

    handler.setInputAction((movement: any) => {
      const pickedObject = viewer.value?.scene.pick(movement.endPosition)
      const canvas = viewer.value?.scene.canvas
      if (!canvas) return

      if (defined(pickedObject) && pickedObject.id?.properties?.photoId) {
        canvas.style.cursor = 'pointer'
      } else {
        canvas.style.cursor = 'default'
      }
    }, ScreenSpaceEventType.MOUSE_MOVE)

    handler.setInputAction((click: ScreenSpaceEventHandler.PositionedEvent) => {
      const pickedObject = viewer.value?.scene.pick(click.position)

      if (defined(pickedObject) && pickedObject.id?.properties) {
        const properties = pickedObject.id.properties
        const captureId = properties.captureId?.getValue()
        const photoId = properties.photoId?.getValue()

        if (captureId && photoId) {
          emit('open-lightbox', { captureId, id: photoId })
        }
      }
    }, ScreenSpaceEventType.LEFT_CLICK)
})

onBeforeUnmount(() => {
  if (handler) {
    handler.destroy()
    handler = null
  }
  if (viewer.value) {
    viewer.value.destroy()
  }
})

watch(() => props.captures, (newCaptures) => {
    if (!viewer.value || !newCaptures) return

    viewer.value.entities.removeAll()

    newCaptures.forEach(item => {
        if (!item.centroidCoordinates) return

        const parts = item.centroidCoordinates.split(',').map(Number)
        const lat = parts[0]
        const lng = parts[1]

        if (lat !== undefined && lng !== undefined && !isNaN(lat) && !isNaN(lng)) {
            viewer.value?.entities.add({
                id: item.captureId,
                position: Cartesian3.fromDegrees(lng, lat),
                billboard: {
                    image: '/images/blue_marker.png',
                    scale: 1.0,
                    heightReference: HeightReference.CLAMP_TO_GROUND,
                    verticalOrigin: VerticalOrigin.BOTTOM
                },
                properties: { captureId: item.captureId }
            })
        }
    })
}, { deep: true })

function flyToCapture(centroidString: string) {
  if (!viewer.value || !centroidString) return
  const parts = centroidString.split(',').map(Number)
  const lat = parts[0]
  const lng = parts[1]

  if (lat !== undefined && lng !== undefined && !isNaN(lat) && !isNaN(lng)) {
    const targetPosition = Cartesian3.fromDegrees(lng, lat)
    const offset = new HeadingPitchRange(0.0, CesiumMath.toRadians(-45), 15000)

    viewer.value.camera.flyToBoundingSphere(
      new BoundingSphere(targetPosition, 0),
      { offset, duration: 1.5 }
    )
  }
}

function handlePhotoEntities(payload: { captureId: string; enabled: boolean; photos: any[] }) {
    if (!viewer.value) return

    const { captureId, enabled, photos } = payload
    const entityCollection = viewer.value.entities
    const primitiveCollection = viewer.value.scene.primitives

    const entityIdsToRemove: string[] = []
    for (const entity of entityCollection.values) {
        if (entity?.id && typeof entity.id === 'string' && entity.id.startsWith(`photo_${captureId}_`)) {
            entityIdsToRemove.push(entity.id)
        }
    }

    entityIdsToRemove.forEach(id => entityCollection.removeById(id))

    const primitivesToRemove: any[] = []
    for (let i = 0; i < primitiveCollection.length; i++) {
        const primitive = primitiveCollection.get(i)
        if ((primitive as any)._photoCaptureId === captureId) {
            primitivesToRemove.push(primitive)
        }
    }
    primitivesToRemove.forEach(p => primitiveCollection.remove(p))

    if (!enabled) return

    if (photos && photos.length > 0) {
        const positionsToSample: Cartographic[] = []
        const validPhotos: Array<{ photo: any, cartographic: Cartographic }> = []

        photos.forEach(photo => {
            if (photo.gpsCoordinates) {
                const parts = photo.gpsCoordinates.split(',').map(Number)
                const lat = parts[0]
                const lng = parts[1]

                if (lat !== undefined && lng !== undefined && !isNaN(lat) && !isNaN(lng)) {
                    const alt = photo.gpsAltitude ?? 0 
                    const cartographic = Cartographic.fromDegrees(lng, lat, alt)
                    
                    positionsToSample.push(cartographic)
                    validPhotos.push({ photo, cartographic })
                }
            }
        })

        if (positionsToSample.length > 0) {
            const terrainProvider = viewer.value.terrainProvider

            const samplingPromise = terrainProvider && typeof sampleTerrainMostDetailed === 'function'
                ? sampleTerrainMostDetailed(terrainProvider, positionsToSample)
                : Promise.resolve(positionsToSample)

            samplingPromise
                .then(updatedPositions => {
                    updatedPositions.forEach((cartographic, index) => {
                        const item = validPhotos[index]
                        if (!item || !cartographic) return
                        
                        const { photo } = item
                        const captureId = photo.captureId

                        //cartographic.height += 2

                        const position = Ellipsoid.WGS84.cartographicToCartesian(cartographic)

                        entityCollection.add({
                            id: `photo_${captureId}_${photo.photoId}`,
                            position: position,
                            billboard: {
                                image: MAP_CONFIG.icons.photoMarker,
                                scale: 1.0,
                                heightReference: HeightReference.NONE, 
                                verticalOrigin: VerticalOrigin.BOTTOM,
                                //pixelOffset: new Cartesian3(0, -10, 0)
                            },
                            properties: { photoId: photo.photoId, captureId }
                        })

                        try {
                            const heading = CesiumMath.toRadians(photo.heading ?? 0) - (Math.PI / 2)
                            const rawTilt = photo.tiltY ?? 0
                            const pitch = CesiumMath.toRadians(rawTilt - 90)
                            const roll = CesiumMath.toRadians(photo.roll ?? 0)
                            const fov = CesiumMath.toRadians(photo.fov ?? 60)

                            const frustum = new PerspectiveFrustum({
                                fov: fov,
                                aspectRatio: 4 / 3,
                                near: 1.0,
                                far: 1000.0
                            })

                            const hpr = new HeadingPitchRoll(heading, pitch, roll)
                            const orientation = Transforms.headingPitchRollQuaternion(position, hpr)

                            const frustumGeometry = new FrustumGeometry({
                                frustum: frustum,
                                origin: position,
                                orientation: orientation,
                                vertexFormat: PerInstanceColorAppearance.VERTEX_FORMAT
                            })

                            const primitive = new Primitive({
                                geometryInstances: new GeometryInstance({
                                    geometry: frustumGeometry,
                                    attributes: {
                                        color: ColorGeometryInstanceAttribute.fromColor(
                                            Color.fromCssColorString('#3273dc').withAlpha(0.25)
                                        )
                                    }
                                }),
                                appearance: new PerInstanceColorAppearance({
                                    translucent: true,
                                    closed: true
                                })
                            })

                            ;(primitive as any)._photoCaptureId = captureId

                            primitiveCollection.add(primitive)
                        } catch (err) {
                            console.error('Failed to construct photo FOV frustum geometry:', err)
                        }
                    })
                })
                .catch(err => {
                    console.error('Failed to sample terrain heights for photos:', err)
                })
        }
    }
}

defineExpose({ flyToCapture, handlePhotoEntities })
</script>