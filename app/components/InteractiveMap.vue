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

        <MapPopup ref="popupRef" v-if="popupInfo.visible" :x="popupInfo.x" :y="popupInfo.y" :results="popupInfo.results" @close="closePopup"/>

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
import { onMounted, ref, onBeforeUnmount, onUnmounted, watch, reactive, shallowRef } from 'vue'
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
  Cartesian2,
  defined,
  Entity
} from 'cesium'
import 'cesium/Build/Cesium/Widgets/widgets.css'
import ZoomControl from './mapControls/ZoomControl.vue'
import NorthArrowControl from './mapControls/NorthArrowControl.vue'
import LookDownControl from './mapControls/LookDownControl.vue'
import MapbiomasLayer from './mapComponents/MapbiomasLayer.vue'
import TopojsonLayer from './mapComponents/TopojsonLayer.vue'
import LayerControl from './mapControls/LayerControl.vue'
import ResetViewControl from './mapControls/ResetViewControl.vue'
import { mapConfig } from '@/scripts/config'
import { overlayLayers } from '@/scripts/map/overlays'
import MapPopup from './mapComponents/MapPopup.vue'
import { useMapStore } from '@/scripts/stores/map'
import { useAuthStore } from '@/scripts/stores/auth'

declare global {
  interface Window {
    CESIUM_BASE_URL: string
  }
}

const config = useRuntimeConfig()
const mapStore = useMapStore()
const authStore = useAuthStore()

window.CESIUM_BASE_URL = '/cesium/'
Ion.defaultAccessToken = config.public.cesiumIonToken

const props = defineProps<{
  captures?: any[]
}>()

const emit = defineEmits<{
  (e: 'open-lightbox', payload: { captureId: string; id: string; username?: string }): void
  (e: 'open-capture', captureId: string): void
  (e: 'search-location', payload: { lat: number; lon: number }): void 
}>()

const popupRef = ref<HTMLElement | null>(null)
const viewer = shallowRef<Viewer | null>(null)
let handler: ScreenSpaceEventHandler | null = null

// Search Center Entities
let searchCenterEntity: Entity | null = null
let searchCenterFillEntity: Entity | null = null

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

// ---------------------------------------------------------------------------
// Search Center Geometry Helpers
// ---------------------------------------------------------------------------
function computeOffset(center: Cartographic, bearing: number, distance: number) {
    const ellipsoid = Ellipsoid.WGS84
    const R = ellipsoid.maximumRadius
    const delta = distance / R

    const phi1 = center.latitude
    const lambda1 = center.longitude

    const phi2 = Math.asin(
        Math.sin(phi1) * Math.cos(delta) +
        Math.cos(phi1) * Math.sin(delta) * Math.cos(bearing)
    )

    const lambda2 = lambda1 + Math.atan2(
        Math.sin(bearing) * Math.sin(delta) * Math.cos(phi1),
        Math.cos(delta) - Math.sin(phi1) * Math.sin(phi2)
    )

    return new Cartographic(lambda2, phi2)
}

function updateSearchCenterPoint(viewerInstance: Viewer, lat: number | null, lon: number | null) {
    if (!viewerInstance || lat == null || lon == null || !authStore.isReviewer) return
    const position = Cartesian3.fromDegrees(lon, lat)

    if (!searchCenterEntity) {
        searchCenterEntity = viewerInstance.entities.add({
            id: 'search-center',
            position,
            point: {
                pixelSize: 12,
                color: Color.fromCssColorString('#e38b2c').withAlpha(0.9),
                outlineColor: Color.BLACK,
                outlineWidth: 2,
                disableDepthTestDistance: Number.POSITIVE_INFINITY,
                heightReference: HeightReference.CLAMP_TO_GROUND
            }
        })
    } else {
        searchCenterEntity.position = position as any
        searchCenterEntity.show = true
    }
}

let searchCenterCircleEntity: Entity | null = null

function makeTrueCircle(lon: number, lat: number, radiusMeters: number, segments = 128) {
    const center = Cartographic.fromDegrees(lon, lat)
    const positions: number[] = []

    // Use <= segments so the circle closes cleanly at 2 * Math.PI
    for (let i = 0; i <= segments; i++) {
        const bearing = (i / segments) * 2 * Math.PI
        const dest = computeOffset(center, bearing, radiusMeters)
        positions.push(dest.longitude, dest.latitude)
    }

    return Cartesian3.fromRadiansArray(positions)
}

function updateSearchCenterCircle(viewerInstance: Viewer, lat: number | null, lon: number | null, radiusKm: number) {
    if (!viewerInstance || lat == null || lon == null || !authStore.isReviewer) return

    if (!Number.isFinite(radiusKm) || radiusKm <= 0 || radiusKm > 4500) {
        if (searchCenterCircleEntity) searchCenterCircleEntity.show = false
        return
    }

    const radiusMeters = radiusKm * 1000
    const circlePositions = makeTrueCircle(lon, lat, radiusMeters)
    const lineColor = Color.fromCssColorString('#e38b2c').withAlpha(0.9)

    if (!searchCenterCircleEntity) {
        searchCenterCircleEntity = viewerInstance.entities.add({
            id: 'search-center-circle',
            polyline: {
                positions: circlePositions,
                width: 4.0,
                material: lineColor.withAlpha(0.5),
                clampToGround: true
            }
        })
    } else {
        searchCenterCircleEntity.polyline!.positions = circlePositions as any
        searchCenterCircleEntity.show = true
    }
}

function handleLongPress(position: Cartesian2) {
    if (!authStore.isReviewer) return

    const viewerInstance = viewer.value
    if (!viewerInstance) return

    closePopup()

    const scene = viewerInstance.scene
    const ellipsoid = scene.globe.ellipsoid
    const cartesian = viewerInstance.camera.pickEllipsoid(position, ellipsoid)
    if (!cartesian) return

    const cartographic = Cartographic.fromCartesian(cartesian)
    const lat = CesiumMath.toDegrees(cartographic.latitude)
    const lon = CesiumMath.toDegrees(cartographic.longitude)

    // 1. Instantly draw just the point for zero-lag feedback
    updateSearchCenterPoint(viewerInstance, lat, lon)
    viewerInstance.scene.requestRender()

    // 2. Trigger the fetch/store update in SidePanel
    emit('search-location', { lat, lon })
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
            mapConfig.defaultView.destination.longitude,
            mapConfig.defaultView.destination.latitude,
            mapConfig.defaultView.destination.height
        ),
        orientation: mapConfig.defaultView.orientation
    })

    ;(window as any).viewer = viewer.value

    if (mapStore.lat != null && mapStore.lon != null) {
        updateSearchCenterPoint(viewer.value, mapStore.lat, mapStore.lon)
        updateSearchCenterCircle(viewer.value, mapStore.lat, mapStore.lon, mapStore.radiusKm)
        viewer.value.scene.requestRender()
    }

    handler = new ScreenSpaceEventHandler(viewer.value.scene.canvas)

    if (viewer.value && !viewer.value.isDestroyed()) {

        // -------------------------------------------------------------------
        // Long-Press Detection Setup
        // -------------------------------------------------------------------
        let pressTimer: NodeJS.Timeout | null = null
        let startPos: Cartesian2 | null = null
        let cameraMoved = false
        let lastCameraPos: Cartesian3 | null = null
        const MOVE_THRESHOLD = 8

        viewer.value.scene.postRender.addEventListener(() => {
            const viewerInstance = viewer.value
            if (!viewerInstance) return
            const cam = viewerInstance.camera.positionWC
            if (lastCameraPos) {
                if (!Cartesian3.equals(cam, lastCameraPos)) {
                    cameraMoved = true
                }
            }
            lastCameraPos = Cartesian3.clone(cam)
        })

        handler.setInputAction((click: any) => {
            cameraMoved = false
            startPos = click.position

            pressTimer = setTimeout(() => {
                if (!cameraMoved) {
                    handleLongPress(click.position)
                }
            }, 500)
        }, ScreenSpaceEventType.LEFT_DOWN)

        handler.setInputAction(() => {
            if (pressTimer) clearTimeout(pressTimer)
        }, ScreenSpaceEventType.LEFT_UP)

        handler.setInputAction((movement: any) => {
            if (!startPos) return
            const dx = movement.endPosition.x - startPos.x
            const dy = movement.endPosition.y - startPos.y

            if (Math.abs(dx) > MOVE_THRESHOLD || Math.abs(dy) > MOVE_THRESHOLD) {
                if (pressTimer) clearTimeout(pressTimer)
            }
        }, ScreenSpaceEventType.MOUSE_MOVE)

        // -------------------------------------------------------------------
        // Mouse Move & Click Handlers
        // -------------------------------------------------------------------
        handler.setInputAction((movement: any) => {
            const viewerInstance = viewer.value
            if (!viewerInstance || viewerInstance.isDestroyed()) return

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
        }, ScreenSpaceEventType.MOUSE_MOVE)

        handler.setInputAction(async (click: ScreenSpaceEventHandler.PositionedEvent) => {
            const viewerInstance = viewer.value
            if (!viewerInstance || viewerInstance.isDestroyed()) return

            const pickedObject = viewerInstance.scene.pick(click.position)

            if (defined(pickedObject) && pickedObject.id?.properties) {
                const properties = pickedObject.id.properties
                const captureId = properties.captureId?.getValue()
                const photoId = properties.photoId?.getValue()
                const username = properties.username?.getValue()

                if (captureId && photoId) {
                    emit('open-lightbox', { captureId, id: photoId, username })
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
    }

    document.addEventListener('click', handleClickOutside)
})

// Watch store state changes (e.g., radius adjustments) to update Cesium overlay
watch(() => [mapStore.lat, mapStore.lon, mapStore.radiusKm], ([lat, lon, radius]) => {
    if (!viewer.value) return
    if (lat != null && lon != null) {
        updateSearchCenterPoint(viewer.value, lat as number, lon as number)
        updateSearchCenterCircle(viewer.value, lat as number, lon as number, radius as number)
        viewer.value.scene.requestRender()
    }
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

    const entityCollection = viewer.value.entities
    const entityIdsToRemove: string[] = []
    
    for (const entity of entityCollection.values) {
        if (entity?.id && typeof entity.id === 'string' && entity.id !== 'search-center' && entity.id !== 'search-center-circle') {
            entityIdsToRemove.push(entity.id)
        }
    }
    entityIdsToRemove.forEach(id => entityCollection.removeById(id))

    if (viewer.value) {
        const scenePrimitives = viewer.value.scene.primitives
        const primitivesToRemove: any[] = []
        
        for (let i = 0; i < scenePrimitives.length; i++) {
            const primitive = scenePrimitives.get(i)
            // Check if this primitive belongs to the capture being toggled off
            if ((primitive as any)._photoCaptureId) {
                primitivesToRemove.push(primitive)
            }
        }
        
        primitivesToRemove.forEach(p => scenePrimitives.remove(p))
    }

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
                    pixelOffset: new Cartesian2(0, -10),
                    disableDepthTestDistance: 50000.0 
                },
                properties: { captureId: item.captureId }
            })
        }
    })

    viewer.value.scene.requestRender()
})

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

function handlePhotoEntities(payload: { captureId: string; enabled: boolean; photos: any[]; username?: string }) {
    if (!viewer.value) return

    const { captureId, enabled, photos, username } = payload
    const entityCollection = viewer.value.entities
    const primitiveCollection = viewer.value.scene.primitives

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

    const primitivesToRemove: any[] = []
    for (let i = 0; i < primitiveCollection.length; i++) {
        const primitive = primitiveCollection.get(i)
        if ((primitive as any)._photoCaptureId === captureId) {
            primitivesToRemove.push(primitive)
        }
    }
    primitivesToRemove.forEach(p => primitiveCollection.remove(p))

    viewer.value.scene.requestRender()

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
                                            material: Color.fromCssColorString(mapConfig.colors.accuracyCircleColor).withAlpha(0.6),
                                            clampToGround: true
                                        },
                                        properties: { photoId: photo.photoId, captureId }
                                    })
                                }
                            }
                        } catch (err) {
                            console.error('Failed to create GPS accuracy circle:', err)
                        }

                        entityCollection.add({
                            id: `photo_${captureId}_${photo.photoId}`,
                            position: position,
                            billboard: {
                                image: mapConfig.icons.photoMarker,
                                scale: 1.0,
                                heightReference: HeightReference.NONE, 
                                verticalOrigin: VerticalOrigin.BOTTOM
                            },
                            properties: { photoId: photo.photoId, captureId, username }
                        })

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
                                    material: Color.fromCssColorString(mapConfig.colors.headingArrowColor),
                                    clampToGround: true
                                },
                                properties: { photoId: photo.photoId, captureId }
                            })
                        } catch (err) {
                            console.error('Failed to create ground polyline arrow:', err)
                        }

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
                                            Color.fromCssColorString(mapConfig.colors.cameraFrustumColor).withAlpha(0.25)
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