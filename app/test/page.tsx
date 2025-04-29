"use client"
import * as React from 'react';

import jsPDF from 'jspdf';
import exifr from 'exifr';

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


import { loadImageFile } from '@/lib/functions';
// import { getLocationName, loadImageFile, createHighResCanvas, printTemplate } from '@/lib/functions'
import Photo from '@/components/photo'

// DPI配置
const DPI = 300;
const INCH_TO_MM = 25.4;

const mmToPixels = (mm: number): number => {
  return Math.round((mm / INCH_TO_MM) * DPI);
}

const pixelsToMM = (pixels: number): number => {
  return Math.round((pixels / DPI) * INCH_TO_MM);
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
  // 用于存储所有 canvas 的引用
  // const canvasRefs = React.useRef<HTMLCanvasElement[]>([]);
  // const [count, setCount] = React.useState<number>(0)
  // const [imageMap, setImageMap] = React.useState<{[key: number]: HTMLImageElement|Boolean}>({});

  const [selectedSize, setSelectedSize] = React.useState<PaperSizeKey>('7inch');
  const [files, setFiles] = React.useState<File[]>([])
  const [canvasMap, setCanvasMap] = React.useState<{[key: number]: {
    ready: boolean,
    canvas: HTMLCanvasElement
  }}>({});
  const [okToPrint, setOkToPrint] = React.useState<boolean>(false)

  const handleSelectedSize = (value: string) => {
    if (isPaperSizeKeyOptimized(value))
      setSelectedSize(value)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.debug(typeof (e.target.files))
    console.debug(e.target.files)
    if (e.target.files) {
        // 将 FileList 转换为 File 数组
      const newFiles = Array.from(e.target.files);
      setFiles(Array.from(e.target.files));
    }
  }

  const generatePDF = () => {
    const doc = new jsPDF({
      unit: 'mm',
      orientation: 'portrait', // 初始方向（会被后续页面覆盖）
      format: [127, 178] // 初始页面尺寸
    });

    Object.entries(canvasMap).map(([index, photo], _index)=>{
      const canvas = photo.canvas;
      if (_index > 0) {
        // 添加新页并动态设置方向
        const orientation = canvas.width > canvas.height ? 'landscape' : 'portrait';
        doc.addPage([pixelsToMM(canvas.width), pixelsToMM(canvas.height)], orientation);
      }

      // 添加图像（铺满整页）
      const imageData = canvas.toDataURL('image/png');
      doc.addImage(
        imageData,
        'PNG',
        0,
        0,
        pixelsToMM(canvas.width), 
        pixelsToMM(canvas.height),
        undefined,
        'FAST'
      );
    })
    doc.save('mixed-orientation.pdf');
  };

  // React.useEffect(()=>{
  //   console.debug(files)
  // }, [files])

  return (
    <div className="flex flex-col w-screen h-screen max-h-screen bg-accent overflow-hidden">
      <div className="flex w-full py-1 px-4 space-x-4 bg-white shadow text-nowrap">
        <div className="flex space-x-1.5 ">
          <Label htmlFor="paperSize">选择相纸</Label> 
          <Select onValueChange={handleSelectedSize} >
            <SelectTrigger className="w-24 cursor-pointer hover:bg-accent hover:border-gray-400">
              <SelectValue placeholder="7inch" />
            </SelectTrigger>
            <SelectContent >
              {Object.keys(PAPER_SIZES).map((size, index) => <SelectItem key={index} value={size} className='cursor-pointer'>{size}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="flex space-x-1.5">
          <Input
            id="selectPhoto"
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className='cursor-pointer hover:bg-accent hover:border-gray-400'
            multiple
          />
        </div>
        <div className="flex flex-grow justify-end">
          <Button className='cursor-pointer px-8 select-none' disabled={!okToPrint} onClick={generatePDF}>Print</Button>
        </div>
      </div>
      <ScrollArea className="w-full h-dvh ">
        <div className='flex flex-wrap p-4 gap-4'>
          {files.map((file, index) => (
            <Photo key={file.size} index={index} file={file} setCanvasMap={setCanvasMap} ></Photo>
          ))}
        </div>

      </ScrollArea>
    </div>
  )
}