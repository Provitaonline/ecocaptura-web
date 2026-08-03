export interface OverlayDefinition {
  id: string
  nameKey: string
  defaultVisible: boolean
}

export const overlayLayers: OverlayDefinition[] = [
  {
    id: 'aoi',
	nameKey: 'map.overlays.aoi',
    defaultVisible: false
  },
]