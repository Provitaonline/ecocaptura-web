export interface OverlayDefinition {
  id: string
  name: string
  defaultVisible: boolean
}

export const overlayLayers: OverlayDefinition[] = [
  {
    id: 'aoi',
    name: 'Area of Interest',
    defaultVisible: false,
  },
]