

import { mmToPixels } from "./functions";
import type { Geometry } from 'geojson';

// 白边配置
export const BLANK_PIXELS = 66;

// DPI配置
export const DPI = 300;
export const INCH_TO_MM = 25.4;

// 相纸配置
export const PAPER_SIZES = {
  '7inch': {
    mmWidth: 178,
    mmHeight: 127,
    pixelWidth: mmToPixels(178),
    pixelHeight: mmToPixels(127)
  },
  '8inch': {
    mmWidth: 203,
    mmHeight: 152,
    pixelWidth: mmToPixels(203),
    pixelHeight: mmToPixels(152)
  }
};

export const VALID_PAPER_KEYS = new Set(Object.keys(PAPER_SIZES));

export type PaperSizeKey = keyof typeof PAPER_SIZES;
export type PaperConfig = typeof PAPER_SIZES['7inch'];

export type Region = {
  properties: {
    name: string;
    adcode: string;
  };
  geometry: Geometry;
};

export type GeoData = {
  "province": Region[] | null;
  "city": Region[] | null;
  "distinct": Region[] | null;
}

export type PhotoMap = {
  [key: string]: {
    processingImg: boolean,
    processingWatermarker: boolean,
    file: File,
    // img?: HTMLImageElement,
    canvas?: HTMLCanvasElement
  }
}