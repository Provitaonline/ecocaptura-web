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
    url: 'https://geoportalp-files.s3-us-east-2.amazonaws.com/vtiles/limites_estadales_de_venezuela_igvsb_wgs84/{z}/{x}/{y}.pbf',
    type: 'mvt'
  }
]