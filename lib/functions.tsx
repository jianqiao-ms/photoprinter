import { INCH_TO_MM, PaperSizeKey, VALID_PAPER_KEYS, DPI } from "./const";

export const mmToPixels = (mm: number): number => {
  return Math.round((mm / INCH_TO_MM) * DPI);
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
  
export function createHighResCanvas(original: HTMLCanvasElement, scale = 2): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    
    canvas.width = original.width * scale;
    canvas.height = original.height * scale;
    
    ctx.scale(scale, scale);
    ctx.drawImage(original, 0, 0);
    
    return canvas;
  }
  
 export async function getLocationName(lat: number, lon: number): Promise<string> {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`
      );
      const data = await response.json();
      return data.display_name || 'Unknown Location';
    } catch {
      return 'Unknown Location';
    }
  }
  
export function printTemplate(imageUrl: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>照片打印</title>
          <style>
            @page {
              size: 178mm 127mm;
              margin: 0;
            }
            body { 
              margin: 0;
              width: 178mm;
              height: 127mm;
            }
            img {
              width: 100%;
              height: 100%;
              object-fit: contain;
            }
          </style>
        </head>
        <body>
          <img src="${imageUrl}" />
        </body>
      </html>
    `;
  }
  