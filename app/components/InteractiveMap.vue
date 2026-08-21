<template>
  <div class="map-grid-map map-touch-wrapper">
    <div id="mapRoot" style="position: relative;">
      
        <div id="cesiumContainer"></div>

        <TopojsonLayer :viewer="viewer" nameKey="map.overlays.aoi" :visible="overlayStates['aoi'] ?? true" v-if="viewer"/>
		<MapbiomasLayer :autoZoom="false" :viewer="viewer" :visible="overlayStates['mapbiomas'] ?? true" v-if="viewer"/>
        <TopojsonLayer :viewer="viewer" nameKey="map.overlays.states" :visible="overlayStates['states'] ?? true" v-if="viewer"/>
        <TopojsonLayer :viewer="viewer" nameKey="map.overlays.anp" :visible="overlayStates['anp'] ?? true" v-if="viewer"/>

        <div class="map-top map-right" v-if="viewer">
            <NorthArrowControl :viewer="viewer" />
            <ZoomControl :viewer="viewer" />
            <LookDownControl :viewer="viewer" />
            <ResetViewControl :viewer="viewer" />
            <LayerControl :viewer="viewer" @update:overlay="handleOverlayUpdate" />
        </div>

        <MapPopup
            ref="popupRef"
            v-if="popupInfo.visible"
            :x="popupInfo.x"
            :y="popupInfo.y"
            :results="popupInfo.results"
            @close="closePopup"
        />

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
  Matrix4,
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
import MapbiomasLayer from './mapComponents/MapbiomasLayer.vue'
import TopojsonLayer from './mapComponents/TopojsonLayer.vue'
import LayerControl from './mapControls/LayerControl.vue'
import ResetViewControl from './mapControls/ResetViewControl.vue'
import { MAP_CONFIG } from '@/scripts/config'
import { reactive } from 'vue'
import { overlayLayers } from '@/scripts/map/overlays'
import MapPopup from './mapComponents/MapPopup.vue'

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
  (e: 'open-capture', captureId: string): void
}>()

const popupRef = ref<HTMLElement | null>(null)
const viewer = ref<Viewer | null>(null)
let handler: ScreenSpaceEventHandler | null = null

const popupInfo = ref({
  visible: false,
  x: 0,
  y: 0,
  results: [] as Array<{ title: string; content: string }>
})

const overlayStates = reactive<Record<string, boolean>>(
  Object.fromEntries(overlayLayers.map(layer => [layer.id, layer.defaultVisible]))
)

function handleOverlayUpdate(id: string, visible: boolean) {
  overlayStates[id] = visible
}

function closePopup() {
  popupInfo.value.visible = false
}

function handleClickOutside(e: MouseEvent) {
  if (popupInfo.value.visible && popupRef.value && !popupRef.value.contains(e.target as Node)) {
    closePopup()
  }
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
        terrainExaggeration: 2,
        requestRenderMode: true,
        maximumRenderTimeChange: Infinity
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

    requestAnimationFrame(() => {
        if (!viewer.value || viewer.value.isDestroyed()) return

        const localHandler = new ScreenSpaceEventHandler(viewer.value.scene.canvas)
        handler = localHandler

        let ticking = false
        
        // MOUSE_MOVE handler throttled via requestAnimationFrame with safe try/catch
        /*localHandler.setInputAction((movement: any) => {
            if (ticking) return
            ticking = true

            requestAnimationFrame(() => {
                ticking = false
            })

            const viewerInstance = viewer.value
            if (!viewerInstance || viewerInstance.isDestroyed()) return

            try {
                const pickedObject = viewerInstance.scene.pick(movement.endPosition)
                const canvas = viewerInstance.scene.canvas
                if (!canvas) return

                if (defined(pickedObject) && pickedObject.id?.properties) {
                    const props = pickedObject.id.properties
                    if (props.captureId || props.photoId) {
                        canvas.style.cursor = 'pointer'
                        return
                    }
                }
                canvas.style.cursor = 'default'
            } catch (e) {
                // Silently absorb worker serialization collision during hot-reload
            }
        }, ScreenSpaceEventType.MOUSE_MOVE) */

        localHandler.setInputAction(async (click: ScreenSpaceEventHandler.PositionedEvent) => {
            const viewerInstance = viewer.value
            if (!viewerInstance || viewerInstance.isDestroyed()) return

            // 1. Handle existing GeoJSON / Entity clicks (Lightbox & Captures)
            const pickedObject = viewerInstance.scene.pick(click.position)

            if (defined(pickedObject) && pickedObject.id?.properties) {
                const properties = pickedObject.id.properties
                const captureId = properties.captureId?.getValue()
                const photoId = properties.photoId?.getValue()

                if (captureId && photoId) {
                    emit('open-lightbox', { captureId, id: photoId })
                    return 
                } else if (captureId) {
                    emit('open-capture', captureId)
                    return 
                }
            }

            const { queryAllLayers } = useMapLayers()
            const ray = viewerInstance.camera.getPickRay(click.position)
            const cartesian = ray ? viewerInstance.scene.globe.pick(ray, viewerInstance.scene) : undefined

            if (cartesian) {
                const cartographic = Cartographic.fromCartesian(cartesian)
                const layerResults = await queryAllLayers(cartesian, cartographic, click.position)
                
                if (layerResults.length > 0) {
                    popupInfo.value = {
                        visible: true,
                        x: click.position.x,
                        y: click.position.y,
                        results: layerResults
                    }
                } else {
                    closePopup()
                }
            } else {
                closePopup()
            }

        }, ScreenSpaceEventType.LEFT_CLICK)
    })

    document.addEventListener('click', handleClickOutside)
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

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
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
                    verticalOrigin: VerticalOrigin.BOTTOM,
					eyeOffset: new Cartesian3(0.0, 0.0, -15.0)
                },
                properties: { captureId: item.captureId }
            })
        }
    })
}, { deep: true, immediate: true })

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

    // 1. Remove all photo-related entities matching this capture ID
    const entityIdsToRemove: string[] = []
    for (const entity of entityCollection.values) {
        if (entity?.id && typeof entity.id === 'string' && (
            entity.id.startsWith(`photo_${captureId}_`) || 
            entity.id.startsWith(`photo_arrow_${captureId}_`) ||
            entity.id.startsWith(`photo_accuracy_${captureId}_`)
        )) {
            entityIdsToRemove.push(entity.id)
        }
    }
    entityIdsToRemove.forEach(id => entityCollection.removeById(id))

    // 2. Remove all photo-related 3D primitives (frustums) matching this capture ID
    const primitivesToRemove: any[] = []
    for (let i = 0; i < primitiveCollection.length; i++) {
        const primitive = primitiveCollection.get(i)
        if ((primitive as any)._photoCaptureId === captureId) {
            primitivesToRemove.push(primitive)
        }
    }
    primitivesToRemove.forEach(p => primitiveCollection.remove(p))

    // Request a render immediately after clearing items out
    viewer.value.scene.requestRender()

    // GUARD: If toggle is disabled, stop here after clearing everything out
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

                        const position = Ellipsoid.WGS84.cartographicToCartesian(cartographic)

                        // Add Accuracy Circle via Polyline
                        const accuracyRadius = photo.gpsAccuracy ?? 10.0
                        try {
                            const pointsCount = 32
                            const finalPositions: Cartesian3[] = []
                            const transform = Transforms.eastNorthUpToFixedFrame(position)

                            for (let i = 0; i < pointsCount; i++) {
                                const angle = (i / pointsCount) * (2 * Math.PI)
                                const dx = accuracyRadius * Math.cos(angle)
                                const dy = accuracyRadius * Math.sin(angle)
                                
                                const pt = Matrix4.multiplyByPoint(
                                    transform, 
                                    new Cartesian3(dx, dy, 0.2), 
                                    new Cartesian3()
                                )
                                if (pt) {
                                    finalPositions.push(pt as Cartesian3)
                                }
                            }

                            if (finalPositions.length > 0) {
                                const firstPoint = finalPositions[0]
                                if (firstPoint) {
                                    const outlinePositions: Cartesian3[] = [...finalPositions, firstPoint]
                                    
                                    entityCollection.add({
                                        id: `photo_accuracy_${captureId}_${photo.photoId}`,
                                        polyline: {
                                            positions: outlinePositions,
                                            width: 2.0,
                                            material: Color.fromCssColorString('#3273dc').withAlpha(0.6),
                                            clampToGround: true
                                        },
                                        properties: { photoId: photo.photoId, captureId }
                                    })
                                }
                            }
                        } catch (err) {
                            console.error('Failed to create GPS accuracy circle:', err)
                        }

                        // Add Photo Marker Billboard
                        entityCollection.add({
                            id: `photo_${captureId}_${photo.photoId}`,
                            position: position,
                            billboard: {
                                image: MAP_CONFIG.icons.photoMarker,
                                scale: 1.0,
                                heightReference: HeightReference.NONE, 
                                verticalOrigin: VerticalOrigin.BOTTOM
                            },
                            properties: { photoId: photo.photoId, captureId }
                        })

                        // Add Ground Polyline Arrow pointing along heading vector
                        const headingDegrees = photo.heading ?? 0
                        const headingRad = CesiumMath.toRadians(headingDegrees)
                        try {
                            const arrowLengthMeters = 100.0
                            const transform = Transforms.eastNorthUpToFixedFrame(position)

                            const forwardX = Math.sin(headingRad) * arrowLengthMeters
                            const forwardY = Math.cos(headingRad) * arrowLengthMeters
                            const tipCartesian = Matrix4.multiplyByPoint(transform, new Cartesian3(forwardX, forwardY, 0), new Cartesian3())

                            const wingBackDist = 5.0
                            const wingWidthDist = 4.0
                            const backX = Math.sin(headingRad) * (arrowLengthMeters - wingBackDist)
                            const backY = Math.cos(headingRad) * (arrowLengthMeters - wingBackDist)
                            
                            const perpX = Math.cos(headingRad) * wingWidthDist
                            const perpY = -Math.sin(headingRad) * wingWidthDist

                            const leftWing = Matrix4.multiplyByPoint(transform, new Cartesian3(backX - perpX, backY - perpY, 0), new Cartesian3())
                            const rightWing = Matrix4.multiplyByPoint(transform, new Cartesian3(backX + perpX, backY + perpY, 0), new Cartesian3())

                            entityCollection.add({
                                id: `photo_arrow_${captureId}_${photo.photoId}`,
                                polyline: {
                                    positions: [leftWing, tipCartesian, rightWing],
                                    width: 3.0,
                                    material: Color.fromCssColorString('#3273dc'),
                                    clampToGround: true
                                },
                                properties: { photoId: photo.photoId, captureId }
                            })
                        } catch (err) {
                            console.error('Failed to create ground polyline arrow:', err)
                        }

                        // Add 3D Camera Frustum Pyramid Primitive
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

                    // Request a render once all asynchronous batch additions are complete
                    if (viewer.value && !viewer.value.isDestroyed()) {
                        viewer.value.scene.requestRender()
                    }
                })
                .catch(err => {
                    console.error('Failed to sample terrain heights for photos:', err)
                })
        }
    }
}

defineExpose({ flyToCapture, handlePhotoEntities })
</script>