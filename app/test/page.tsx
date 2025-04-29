"use client"
import * as React from 'react';

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"


// import { loadImageFile } from '@/lib/functions';

import Photo from '@/components/photo'

// DPI配置
const DPI = 300;
const INCH_TO_MM = 25.4;

const mmToPixels = (mm: number): number => {
  return Math.round((mm / INCH_TO_MM) * DPI);
}

// 相纸配置
const PAPER_SIZES = {
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

const VALID_PAPER_KEYS = new Set(Object.keys(PAPER_SIZES));

function isPaperSizeKeyOptimized(key: string): key is PaperSizeKey {
  return VALID_PAPER_KEYS.has(key);
}

type PaperSizeKey = keyof typeof PAPER_SIZES;
type PaperConfig = typeof PAPER_SIZES['7inch'];

export default function Page() {
  const [selectedSize, setSelectedSize] = React.useState<PaperSizeKey>('7inch');
  const [count, setCount] = React.useState<number>(0)
  const [filelist, setFilelist] = React.useState<{ [key: number]: File }>({})

  const handleSelectedSize = (value: string) => {
    if (isPaperSizeKeyOptimized(value))
      setSelectedSize(value)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.debug(typeof (e.target.files))
    console.debug(e.target.files)
    if (e.target.files) {
      setCount(e.target.files.length)
      Object.entries(e.target.files).map(([index, file],) => {
        setFilelist((previousFile) => (
          {
            ...previousFile,
            [index]: file
          }
        ))
      })
    }
  }

  // 图片处理
  // const processImage = React.useCallback(async (file: File) => {
  //   try {
  // setIsProcessing(true);

  // 读取EXIF
  // const exif = await exifr.parse(file, { tiff: true, xmp: true, gps: true });
  // const date = exif?.DateTimeOriginal?.toLocaleDateString() || '';
  // const location = exif?.latitude && exif?.longitude
  //   ? await getLocationName(exif.latitude, exif.longitude)
  //   : 'Unknown Location';

  // setWatermarkText(`${date} | ${location}`);

  // 加载图片
  // const img = await loadImageFile(file);
  // setPortrait(img.naturalWidth < img.naturalHeight)
  // drawOnCanvas(img, PAPER_SIZES[selectedSize]);
  // } catch (err) {
  //   console.error('处理失败:', err);
  //   alert('图片处理失败，请重试');
  // } finally {
  // setIsProcessing(false);
  // }
  // }, [selectedSize]);

  React.useEffect(() => {
    console.debug(filelist)
  }, [filelist])

  return (
    <div className="flex flex-col w-screen h-screen max-h-screen bg-accent overflow-hidden">
      <div className="flex w-full py-1 px-1 space-x-4 bg-white shadow text-nowrap">
        <div className="flex space-x-1.5">
          <Label htmlFor="paperSize">选择相纸</Label>
          <Select onValueChange={handleSelectedSize}>
            <SelectTrigger className="w-24">
              <SelectValue placeholder="7inch" />
            </SelectTrigger>
            <SelectContent>
              {Object.keys(PAPER_SIZES).map((size, index) => <SelectItem key={index} value={size}>{size}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="flex space-x-1.5">
          <Input
            id="selectPhoto"
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            multiple
          />
        </div>
        <div className="flex flex-grow justify-end">
          <Button className='cursor-pointer' disabled={Object.keys(filelist).length === 0}>Print</Button>
        </div>
      </div>
      <ScrollArea className="w-full h-dvh ">
        <div className='flex flex-wrap p-4 gap-4'>
          {Object.entries(filelist).map(([index, file], _index) => (
            <Photo key={_index} file={file} ></Photo>
          ))}
        </div>

      </ScrollArea>
    </div>
  )
}