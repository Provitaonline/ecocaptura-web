export const overlayLayers = [
  {
    id: 'aoi',
	  nameKey: 'map.overlays.aoi',
    defaultVisible: false,
    type: "geojson"
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
    url: '/data/states.topojson',
    attribute: 'NAM',
    type: 'topojson'
  }
]