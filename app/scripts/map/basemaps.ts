import { UrlTemplateImageryProvider } from 'cesium'

export const imageryProviders = [
  {
	name: 'World Imagery',
	providers: [
	  () => new UrlTemplateImageryProvider({
		url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
		maximumLevel: 19,
		credit: 'Tiles © Esri — Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
	  })
	]
  },
  {
	name: 'OpenStreetMap',
	providers: [
	  () => new UrlTemplateImageryProvider({
		url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
		maximumLevel: 19,
		credit: '©OpenStreetMap'
	  })
	]
  }
]