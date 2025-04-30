"use client"

import { INCH_TO_MM, PaperSizeKey, VALID_PAPER_KEYS, DPI } from "./const";
import useSWR from 'swr';

export const mmToPixels = (mm: number): number => {
  return Math.round((mm / INCH_TO_MM) * DPI);
}

export const pixelsToMM = (pixels: number): number => {
  return Math.round((pixels / DPI) * INCH_TO_MM);
}

export function isPaperSizeKeyOptimized(key: string): key is PaperSizeKey {
  return VALID_PAPER_KEYS.has(key);
}


// 工具函数
export async function loadImageFile(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };
      img.onerror = reject;
      img.src = url;
    });
  }
  
// export function createHighResCanvas(original: HTMLCanvasElement, scale = 2): HTMLCanvasElement {
//     const canvas = document.createElement('canvas');
//     const ctx = canvas.getContext('2d')!;
    
//     canvas.width = original.width * scale;
//     canvas.height = original.height * scale;
    
//     ctx.scale(scale, scale);
//     ctx.drawImage(original, 0, 0);
    
//     return canvas;
//   }
 
// const convertCoord = (lng: number, lat: number) => {
//   return gcoord.transform(
//     [lng, lat],
//     gcoord.WGS84,
//     gcoord.GCJ02
//   ) as [number, number];
// };


export async function getLocationName(lat: number, lon: number, geoData: string ) {
  try {
    // const response = await fetch(
    //   `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`
    // );
    // const data = await response.json();
    // return data.display_name || 'Unknown Location';
    const matchedRegion = geoData.find(region => 
      booleanPointInPolygon(point, region.geometry)
    );
  } catch {
    return 'Unknown Location';
  }
}
  
const fetcher = (url: string) => fetch(url).then((res) => res.json())


export const useGeodata = (category: string) => {
  const { data, error, isLoading } = useSWR(`/geojson/${category}.geojson`, fetcher)
  
  return {
    user: data?.features,
    isLoading,
    isError: error,
  }
}
  
  