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

import { PAPER_SIZES, PaperConfig, PaperSizeKey, BLANK_PIXELS, Region, GeoData, PhotoMap } from '@/lib/const';
import { isPaperSizeKeyOptimized, getLocationName, loadImageFile, mmToPixels, pixelsToMM, useGeodata } from '@/lib/functions'
import { PaperContext, GeoContext, PhotoContext } from '@/lib/context';

import Photo from '@/components/photo'


// let cachedGeoJSON: GeoData = {
//   "province": null,
//   "city": null,
//   "distinct": null
// };
// let cachedGeoJSONC: Region[] | null = null;
// let cachedGeoJSOND: Region[] | null = null;

export default function Page() {
  // const page = React.useContext(PageContext);
  const geodataP = useGeodata('p')
  const geodataC = useGeodata('c')
  const geodataD = useGeodata('d')
  // const { geodataC, error, isLoading } = useSWR('/geojson/c.geojson', fetch)
  // const { geodataD, error, isLoading } = useSWR('/geojson/d.geojson', fetch)

  const [selectedSize, setSelectedSize] = React.useState<PaperSizeKey>('7inch');
  const [files, setFiles] = React.useState<File[]>([])
  const [photos, setPhotos] = React.useState<PhotoMap>({});
  const [readyGeodata, setReadyGeodata] = React.useState<boolean>(false)
  const [readyPrint, setReadyPrint] = React.useState<boolean>(false)

  // const [geoData, setGeoData] = React.useState<{
  //   "province": Region[] | null,
  //   "city": Region[] | null,
  //   "distinct": Region[] | null
  // }>({
  //   "province": null,
  //   "city": null,
  //   "distinct": null
  // });

  const handleSelectedSize = (value: string) => {
    if (isPaperSizeKeyOptimized(value))
      setSelectedSize(value)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      // 将 FileList 转换为 File 数组
      // const newFiles = Array.from(e.target.files);
      // setFiles(Array.from(e.target.files));
      Array.from(e.target.files).map((file, index)=> {
        setPhotos((previous) => ({
          ...previous,
          [index]: {
            processing: false,
            file: file
          }
        }))
      })
    }
  }

  const generatePDF = () => {
    const doc = new jsPDF({
      unit: 'mm',
      orientation: 'portrait', // 初始方向（会被后续页面覆盖）
      format: [127, 178] // 初始页面尺寸
    });

    Object.entries(photos).map(([index, photo], _index) => {
      const canvas = photo.canvas;
      if (!canvas) return;
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

  // 页面加载时初始化GeoJSON
  // React.useEffect(() => {
  //   const loadLocalGeoJSON = async () => {
  //     // if (cachedGeoJSON) {
  //     //   setGeoData(cachedGeoJSON);
  //     //   return;
  //     // }

  //     try {
  //       const responseP = await fetch('/geojson/p.geojson'); // 文件放在public目录下
  //       const responseC = await fetch('/geojson/c.geojson'); // 文件放在public目录下
  //       const responseD = await fetch('/geojson/d.geojson'); // 文件放在public目录下

  //       cachedGeoJSON = {
  //         "province": (await responseP.json()).features,
  //         "city": (await responseC.json()).features,
  //         "distinct": (await responseD.json()).features
  //       }
  //       setGeoData(cachedGeoJSON);
  //     } catch (error) {
  //       console.error('加载本地GeoJSON失败:', error);
  //     }
  //   };

  //   loadLocalGeoJSON();
  // }, []);

  React.useEffect(()=>{
    [geodataP, geodataC, geodataD].forEach((r)=>{
      if (r.isLoading || r.isError)
        setReadyGeodata(false)
        return
    })
    setReadyGeodata(true)
  }, [geodataP, geodataC, geodataD])

  return (
    <PaperContext.Provider value={PAPER_SIZES[selectedSize]}>
      <PhotoContext.Provider value={[photos, setPhotos]}>
      <div className="flex flex-col w-screen h-screen max-h-screen bg-accent overflow-hidden relative">
        <div className={`${readyGeodata ? "hidden" : ""} flex flex-col w-screen h-screen absolute left-0 top-0 bg-black opacity-50`}>
          Loading geodata ...
        </div>
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
            <Button className='cursor-pointer px-8 select-none' disabled={!readyPrint} onClick={generatePDF}>Print</Button>
          </div>
        </div>
        <ScrollArea className="w-full h-dvh ">
          <div className='flex flex-wrap p-4 gap-4'>
            {Object.entries(photos).map(([index, photo], ) => (
              <Photo key={photofile.size} index={index} />
            ))}
          </div>

        </ScrollArea>
      </div>
      </PhotoContext.Provider>
    </PaperContext.Provider>

  )
}