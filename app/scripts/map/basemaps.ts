import { ImageryLayer, OpenStreetMapImageryProvider, Google2DImageryProvider } from 'cesium'
import * as Cesium from 'cesium'

export const imageryProviders = [
	{
	name: 'Microsoft World Imagery',
	providers: [
		() => ImageryLayer.fromWorldImagery({} as Cesium.ImageryLayer.ConstructorOptions)
	]
	},
	{
		name: 'Google Maps Satellite',
		providers: [
		() => Cesium.ImageryLayer.fromProviderAsync(
			Cesium.Google2DImageryProvider.fromIonAssetId({
			assetId: '3830184', 
			mapType: 'satellite'
			}) as unknown as Promise<Cesium.ImageryProvider>
		)
		]
	},
	{
	name: 'OpenStreetMap',
	providers: [
		() => new ImageryLayer(
		new OpenStreetMapImageryProvider({
			url: 'https://tile.openstreetmap.org/',
			maximumLevel: 19,
			credit: '© OpenStreetMap contributors'
		})
		)
	]
	}
]