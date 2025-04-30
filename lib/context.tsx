"use client"
import * as React from 'react'


import { PAPER_SIZES, PaperConfig, PaperSizeKey, BLANK_PIXELS, Region, GeoData , PhotoMap} from '@/lib/const';



export const PaperContext = React.createContext<PaperConfig>(PAPER_SIZES['7inch'])
export const GeoContext = React.createContext<{
    "province": Region[] | null,
    "city": Region[] | null,
    "distinct": Region[] | null
}>({
    "province": null,
    "city": null,
    "distinct": null
})

export const PhotoContext = React.createContext<[PhotoMap, React.Dispatch<React.SetStateAction<PhotoMap>>]>([{}, ()=>null])