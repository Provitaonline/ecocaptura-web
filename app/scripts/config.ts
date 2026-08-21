export const mapConfig = {
	defaultView: {
		destination: {
			longitude: -64.7827,
			latitude: -3.0921,
			height: 1412838
		},
		orientation: {
			heading: 0,
			pitch: -0.96,
			roll: 0
		}
  	},
	icons: {
		photoMarker: 'data:image/svg+xml;base64,' + btoa(`
			<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32">
				<path fill="#3273dc" d="M4,4A2,2 0 0,0 2,6V18A2,2 0 0,0 4,20H20A2,2 0 0,0 22,18V6A2,2 0 0,0 20,4H16.83L15,2H9L7.17,4H4M12,9A3,3 0 0,1 15,12A3,3 0 0,1 12,15A3,3 0 0,1 9,12A3,3 0 0,1 12,9Z" />
			</svg>
			`)
  	}
} as const