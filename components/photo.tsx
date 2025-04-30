"use client"

import { useState, useRef, useEffect, useCallback, useContext } from 'react';
import exifr from 'exifr';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"


import { PAPER_SIZES, PaperConfig, PaperSizeKey, BLANK_PIXELS, Region } from '@/lib/const';
import { getLocationName, loadImageFile, mmToPixels } from '@/lib/functions'
import { PaperContext, PhotoContext } from '@/lib/context';

export default function Photo(props: {
  index: string,
  // file: File,
  // setCanvasMap: React.Dispatch<React.SetStateAction<{ [key: number]: { ready: boolean, canvas: HTMLCanvasElement } }>>,
  // geodata: {
  //     "province": Region[] | null,
  //     "city": Region[] | null,
  //     "distinct": Region[] | null
  //   },
  // selectedSize?: string
}) {

  // const selectedSize:PaperSizeKey = props.selectedSize ? props.selectedSize as PaperSizeKey : '7inch' as PaperSizeKey
  const paper = useContext(PaperContext)
  const [photo, setPhoto] = useContext(PhotoContext)
  const currentPhoto = photo[props.index];

  const [img, setImg] = useState<HTMLImageElement>()
  const [imgurl, setImgurl] = useState<string>("")

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [watermarkText, setWatermarkText] = useState('2025年04月30日 天津');
  const [canvasReady, setCanvasReady] = useState(false);
  const [drawingImg, setDrawingImg] = useState(false);
  const [drawingText, setDrawingText] = useState(false);
  // const [processing, setProcessing] = useState(false);

  const setupImage = useCallback(async (file: File) => {
    try {
      setImg(await loadImageFile(file))
    } catch (err) {
      console.error('处理失败:', err);
      alert('图片处理失败，请重试');
      // setCanvasReady(false);
    } finally {
      // setIsProcessing(false);
    }
  }, [currentPhoto.file]);

  const readExif = async (file: File) => {
    const exif = await exifr.parse(file, { 
      tiff: true, 
      xmp: true, 
      gps: true 
    });

    const location = exif?.latitude && exif?.longitude 
      ? await getLocationName(exif.latitude, exif.longitude)
      : 'Unknown Location';

    const date = exif?.DateTimeOriginal?.toLocaleDateString() || '';
    setWatermarkText(`${date} ${location}`);

  }

  const setupCanvas = () => {
    const canvas = canvasRef.current;
    const container = containerRef.current
    if (!canvas) return;
    if (!container) return;
    if (!img) return;

    // const portrait = img.naturalWidth < img.naturalHeight;
    if (img.naturalWidth < img.naturalHeight) {
      canvas.width = paper.pixelHeight;
      canvas.height = paper.pixelWidth;;
      canvas.style.width = `${container.clientHeight * 127 / 178}px`;
      canvas.style.height = `${container.clientHeight}px`;
    } else {
      canvas.width = paper.pixelWidth;
      canvas.height = paper.pixelHeight;
      canvas.style.width = `${container.clientWidth}px`;
      canvas.style.height = `${container.clientWidth * 127 / 178}px`;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    setPhoto((previous) => ({
      ...previous,
      [props.index]: {
        ...previous[props.index],
        canvas: canvas
      }
    }))
    setCanvasReady(true)
  }

  // 画布绘制
  const drawImgOnCanvas = (img: HTMLImageElement, paper: PaperConfig) => {
    if (drawingText) return;
    setDrawingImg(true)
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 计算缩放
    const imgRatio = img.naturalHeight / img.naturalWidth;
    // const paperRatio = paper.pixelHeight / paper.pixelWidth;

    let drawWidth, drawHeight, offsetX = 0, offsetY = 0;

    if (img.naturalWidth < img.naturalHeight) {
      drawHeight = paper.pixelWidth;
      drawWidth = Math.round(paper.pixelWidth / imgRatio);

      // 缩放
      const blackWidth = paper.pixelHeight - drawWidth
      if (blackWidth > BLANK_PIXELS) {
        drawWidth = paper.pixelHeight - BLANK_PIXELS;
        drawHeight = Math.round((paper.pixelHeight - BLANK_PIXELS) * imgRatio);
        offsetY = (paper.pixelWidth - drawHeight) / 2
      } else {
        offsetX = (blackWidth - BLANK_PIXELS);
      }
    } else {
      drawHeight = Math.round(paper.pixelWidth * imgRatio);
      drawWidth = paper.pixelWidth;

      // 缩放
      const blackWidth = paper.pixelHeight - drawHeight;
      if (blackWidth > BLANK_PIXELS) {
        drawHeight = paper.pixelHeight - BLANK_PIXELS;
        drawWidth = Math.round((paper.pixelHeight - BLANK_PIXELS) / imgRatio);
        offsetX = (paper.pixelWidth - drawWidth) / 2
      } else {
        offsetY = (blackWidth - BLANK_PIXELS);
      }
    }

    ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
    
    // update image url for big show
    setImgurl(canvas.toDataURL('image/png'))
    setDrawingImg(false)
  };

  const drawTextOnCanvas = (img: HTMLImageElement, paper: PaperConfig) => {
    if (drawingImg) return;
    setDrawingText(true)
    if (!watermarkText) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let offsetX = 0, offsetY = 0;
    if (img.naturalWidth < img.naturalHeight) {
      offsetX = paper.pixelHeight - BLANK_PIXELS
      offsetY = 66
    } else {
      offsetX = 66
      offsetY = paper.pixelHeight - 15
    }
    ctx.fillStyle = 'rgba(0, 0, 0, 1)';
    ctx.font = `normal ${BLANK_PIXELS - 40}px Courier`;
    ctx.textBaseline = 'bottom';
    ctx.fillText(
      watermarkText,
      offsetX,
      offsetY
    );
    setImgurl(canvas.toDataURL('image/png'))
    setDrawingText(false)
  };

  // 加载图片
  useEffect(() => {
    console.debug("加载图片")
    // 读取exif
    readExif(currentPhoto.file);
    if (!img)
      setupImage(currentPhoto.file)
  }, [currentPhoto.file]);

  // 读取exif
  // useEffect(()=>{
  // }, [currentPhoto.file])

  // setup canvas
  useEffect(() => {
    console.debug("setup canvas")
    if (!canvasRef.current) return;
    if (!img) return;
    if (canvasReady) return;
    setupCanvas()
  }, [img]);

  // draw image
  useEffect(() => {
    console.debug("draw image")
    if (!canvasRef.current) return;
    if (!img) return;
    if (!canvasReady) return;
    drawImgOnCanvas(img, paper)
  }, [canvasReady, drawingText]);

  // draw watermark
  useEffect(() => {
    console.debug("draw image")
    if (!canvasRef.current) return;
    if (!img) return;
    if (!canvasReady) return;
    drawTextOnCanvas(img, paper)
  }, [canvasReady, drawingImg, watermarkText]);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <div className="flex w-52 h-52 justify-center items-center border border-solid border-orange-200 hover:border-orange-400 cursor-pointer relative" ref={containerRef}>
          <div className='absolute left-0 right-0 top-0 bottom-0 bg-black opacity-0 hover:opacity-25' />
          <canvas ref={canvasRef} className="bg-white shadow" />
        </div></DialogTrigger>
      <DialogContent className="p-0 rounded-none border-none">
        <DialogHeader className="hidden"><DialogTitle></DialogTitle><DialogDescription></DialogDescription></DialogHeader>
        <img src={imgurl} />
      </DialogContent>
    </Dialog>

  );
}
