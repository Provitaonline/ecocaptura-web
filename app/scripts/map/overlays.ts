export const overlayLayers = [
  {
    id: 'aoi',
    nameKey: 'map.overlays.aoi',
    defaultVisible: true,
    url: '/data/aoi.json',
    color: '#FFA500',
    type: 'prebaked'
  },
  {
    id: 'mapbiomas',
    nameKey: 'map.overlays.mapbiomas',
    defaultVisible: false,
    ionAssetId: 5142266,
    cogUrl: 'https://ecocaptura-rasters.s3.us-east-2.amazonaws.com/MapBiomas_Venezuela_2024_cog.tif',
    type: "geotiff",

  },
  {
    id: 'states',
    nameKey: 'map.overlays.states',
    defaultVisible: false,
    url: '/data/states.json',
    attribute: 'NAM',
    color: '#00FFFF',
    type: 'topojson'
  },
  {
    id: 'anp',
    nameKey: 'map.overlays.anp',
    defaultVisible: false,
    url: '/data/protected-areas.json',
    attribute: 'nombre',
    color: '#CBC3E3',
    type: 'topojson'
  }
]