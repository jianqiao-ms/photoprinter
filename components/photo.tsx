"use client"

import { useState, useRef, useEffect, useCallback } from 'react';
import exifr from 'exifr';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"


import { PAPER_SIZES, PaperConfig, PaperSizeKey, BLANK_PIXELS } from '@/lib/const';
import { getLocationName, loadImageFile, createHighResCanvas, printTemplate, mmToPixels,  } from '@/lib/functions'

export default function Photo(props: {
  index: number,
  file: File,
  setCanvasMap: React.Dispatch<React.SetStateAction<{ [key: number]: { ready: boolean, canvas: HTMLCanvasElement } }>>,
  selectedSize?: string
}) {
  
  const selectedSize:PaperSizeKey = props.selectedSize ? props.selectedSize as PaperSizeKey : '7inch' as PaperSizeKey
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // const [selectedSize, setSelectedSize] = useState<PaperSizeKey>('7inch');
  // const [portrait, setPortrait] = useState<Boolean>(true)
  const [watermarkText, setWatermarkText] = useState('');
  const [canvasReady, setCanvasReady] = useState(false);
  const [processing, setProcessing] = useState(false);

  // const setupCanvas = (paper: PaperConfig, portrait: Boolean = true) => {
  //   const canvas = canvasRef.current;
  //   if (!canvas) return;
  //   if (!containerRef.current) return;
  //   console.debug(`containerRef.current?.clientHeight: ${containerRef.current?.clientHeight}`)

  //   if (portrait) {
  //     console.debug(`Image direction: portrait`)
  //     console.debug(`canvas.style.width: ${containerRef.current?.clientHeight * 127 / 178}px`)
  //     console.debug(`canvas.style.height: ${containerRef.current?.clientHeight}px`)
  //     canvas.width = paper.pixelHeight;
  //     canvas.height = paper.pixelWidth;
  //     canvas.style.width = `${containerRef.current?.clientHeight * 127 / 178}px`;
  //     canvas.style.height = `${containerRef.current?.clientHeight}px`;
  //   } else {
  //     console.debug(`Image direction: landscape`)
  //     console.debug(`canvas.style.width: ${containerRef.current?.clientWidth}px `)
  //     console.debug(`canvas.style.height: ${containerRef.current?.clientWidth * 127 / 178}px `)
  //     canvas.width = paper.pixelWidth;
  //     canvas.height = paper.pixelHeight;
  //     canvas.style.width = `${containerRef.current?.clientWidth}px`;
  //     canvas.style.height = `${containerRef.current?.clientWidth * 127 / 178}px`;
  //   }
  //   // setCanvasReady(true)
  //   console.debug("canvas ready 0")
  // };

  // 图片处理
  const processImage = useCallback(async (file: File) => {
    try {
      // setIsProcessing(true);

      // 读取EXIF
      // const exif = await exifr.parse(file, { tiff: true, xmp: true, gps: true });
      // const date = exif?.DateTimeOriginal?.toLocaleDateString() || '';
      // const location = exif?.latitude && exif?.longitude
      //   ? await getLocationName(exif.latitude, exif.longitude)
      //   : 'Unknown Location';

      // setWatermarkText(`${date} | ${location}`);

      // 加载图片
      const img = await loadImageFile(file);
      // setPortrait(img.naturalWidth < img.naturalHeight)

      drawOnCanvas(img, PAPER_SIZES[selectedSize]);
    } catch (err) {
      console.error('处理失败:', err);
      alert('图片处理失败，请重试');
      // setCanvasReady(false);
    } finally {
      // setIsProcessing(false);
    }
  }, [selectedSize, props.file]);

  // 画布绘制
  const drawOnCanvas = (img: HTMLImageElement, paper: PaperConfig) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (!containerRef.current) return;
    const portrait = img.naturalWidth < img.naturalHeight
    console.log(`Image direction: ${portrait ? 'portrain' : 'landscape'}`)

    if (portrait) {
      console.debug(`canvas.width: ${paper.pixelWidth}px`)
      console.debug(`canvas.height: ${paper.pixelHeight}px`)
      console.debug(`canvas.style.width: ${containerRef.current?.clientHeight * 127 / 178}px`)
      console.debug(`canvas.style.height: ${containerRef.current?.clientHeight}px`)
      canvas.width = paper.pixelHeight;
      canvas.height = paper.pixelWidth;;
      canvas.style.width = `${containerRef.current?.clientHeight * 127 / 178}px`;
      canvas.style.height = `${containerRef.current?.clientHeight}px`;
    } else {
      console.debug(`Image direction: landscape`)
      console.debug(`canvas.width: ${paper.pixelHeight}px`)
      console.debug(`canvas.height: ${paper.pixelWidth}px`)
      console.debug(`canvas.style.width: ${containerRef.current?.clientWidth}px `)
      console.debug(`canvas.style.height: ${containerRef.current?.clientWidth * 127 / 178}px `)
      canvas.width = paper.pixelWidth;
      canvas.height = paper.pixelHeight;
      canvas.style.width = `${containerRef.current?.clientWidth}px`;
      canvas.style.height = `${containerRef.current?.clientWidth * 127 / 178}px`;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 计算缩放
    const imgRatio = img.naturalHeight / img.naturalWidth;
    const paperRatio = paper.pixelHeight / paper.pixelWidth;

    let drawWidth, drawHeight, offsetX = 0, offsetY = 0;

    if (portrait) {
      drawHeight = paper.pixelWidth;
      drawWidth = paper.pixelWidth / imgRatio;

      // 缩放
      const blackWidth = paper.pixelHeight - drawWidth
      if (blackWidth > BLANK_PIXELS) {
        drawWidth = paper.pixelHeight - BLANK_PIXELS;
        drawHeight = (paper.pixelHeight - BLANK_PIXELS) * imgRatio;
        offsetY = (paper.pixelWidth - drawHeight) / 2
        console.debug(`drawWidth: ${drawWidth}`)
        console.debug(`drawHeight: ${drawHeight}`)
        console.debug(`offsetY: ${offsetY}`)
      } else {
        offsetX = (blackWidth - BLANK_PIXELS);
      }
    } else {
      drawHeight = paper.pixelWidth * imgRatio;
      drawWidth = paper.pixelWidth;

      // 缩放
      const blackWidth = paper.pixelHeight - drawHeight;
      if (blackWidth > BLANK_PIXELS) {
        drawHeight = paper.pixelHeight - BLANK_PIXELS;
        drawWidth = (paper.pixelHeight - BLANK_PIXELS) / imgRatio;
        offsetX = (paper.pixelWidth - drawWidth) / 2
      } else {
        offsetY = (blackWidth - BLANK_PIXELS);
      }
    }

    // 绘制背景和图片
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, paper.pixelWidth, paper.pixelHeight);
    ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);

    // 添加水印
    if (watermarkText) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.font = `bold ${mmToPixels(5)}px Arial`;
      ctx.textBaseline = 'bottom';
      ctx.fillText(
        watermarkText,
        mmToPixels(5),
        paper.pixelHeight - mmToPixels(5)
      );
    }
    props.setCanvasMap((previousCanvas) => ({
      ...previousCanvas,
      [props.index]: {
        ready: true,
        canvas: canvasRef.current as HTMLCanvasElement
      }
    }))
  };

  // 初始化画布
  useEffect(() => {
    processImage(props.file)
  }, [selectedSize, props.file]);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <div className="flex w-52 h-52 justify-center items-center border border-solid border-orange-200 hover:border-orange-400 cursor-pointer relative" ref={containerRef}>
          <div className='absolute left-0 right-0 top-0 bottom-0 bg-black opacity-0 hover:opacity-25' />
          <canvas ref={canvasRef} className="bg-white shadow" />
        </div></DialogTrigger>
      <DialogContent className="p-0 rounded-none border-none">
        <DialogHeader className="hidden">
          <DialogTitle>Are you absolutely sure?</DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete your account
            and remove your data from our servers.
          </DialogDescription>
        </DialogHeader>
        <img src={canvasRef.current?.toDataURL('image/png')} />
      </DialogContent>
    </Dialog>

  );
}
