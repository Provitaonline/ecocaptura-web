declare module 'cesium-mvt-imagery-provider' {
  import * as Cesium from 'cesium';

  export default class CesiumMVTImageryProvider {
    constructor(options: {
      urlTemplate: string;
      layerName?: string;
      style?: (feature: any) => {
        strokeStyle?: string;
        lineWidth?: number;
        fillStyle?: string;
        [key: string]: any;
      };
      [key: string]: any;
    });
  }
}