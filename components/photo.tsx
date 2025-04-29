"use client"

import { useState, useRef, useEffect, useCallback } from 'react';
import exifr from 'exifr';

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

type PaperSizeKey = keyof typeof PAPER_SIZES;
type PaperConfig = typeof PAPER_SIZES['7inch'];

import { getLocationName, loadImageFile, createHighResCanvas, printTemplate } from '@/lib/functions'

export default function Photo(props: { file: File }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedSize, setSelectedSize] = useState<PaperSizeKey>('7inch');
  const [portrait, setPortrait] = useState<Boolean>(true)
  const [watermarkText, setWatermarkText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // 初始化画布
  useEffect(() => {
    initCanvas(PAPER_SIZES[selectedSize], portrait);
  }, [selectedSize, portrait]);

  const initCanvas = (paper: PaperConfig, portrait: Boolean = true) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (!containerRef.current) return;
    console.debug(`containerRef.current?.clientHeight: ${containerRef.current?.clientHeight}`)

    if (portrait) {
      canvas.width = paper.pixelHeight;
      canvas.height = paper.pixelWidth;
      canvas.style.width = `${containerRef.current?.clientHeight * 127 / 178}px`;
      canvas.style.height = `${containerRef.current?.clientHeight}px`;
    } else {
      canvas.width = paper.pixelWidth;
      canvas.height = paper.pixelHeight;
      canvas.style.width = `${containerRef.current?.clientWidth}px`;
      canvas.style.height = `${containerRef.current?.clientWidth * 127 / 178}px`;
    }
  };

  // 图片处理
  const processImage = useCallback(async (file: File) => {
    try {
      setIsProcessing(true);

      // 读取EXIF
      const exif = await exifr.parse(file, { tiff: true, xmp: true, gps: true });
      const date = exif?.DateTimeOriginal?.toLocaleDateString() || '';
      const location = exif?.latitude && exif?.longitude
        ? await getLocationName(exif.latitude, exif.longitude)
        : 'Unknown Location';

      setWatermarkText(`${date} | ${location}`);

      // 加载图片
      const img = await loadImageFile(file);
      setPortrait(img.naturalWidth < img.naturalHeight)
      drawOnCanvas(img, PAPER_SIZES[selectedSize]);
    } catch (err) {
      console.error('处理失败:', err);
      alert('图片处理失败，请重试');
    } finally {
      setIsProcessing(false);
    }
  }, [selectedSize]);

  // 画布绘制
  const drawOnCanvas = (img: HTMLImageElement, paper: PaperConfig) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 计算缩放
    const imgRatio = img.naturalWidth / img.naturalHeight;
    const paperRatio = paper.pixelWidth / paper.pixelHeight;

    let drawWidth, drawHeight, offsetX = 0, offsetY = 0;

    if (imgRatio > paperRatio) {
      drawWidth = paper.pixelWidth;
      drawHeight = drawWidth / imgRatio;
      offsetY = (paper.pixelHeight - drawHeight) / 2;
    } else {
      drawHeight = paper.pixelHeight;
      drawWidth = drawHeight * imgRatio;
      offsetX = (paper.pixelWidth - drawWidth) / 2;
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
  };

  // 打印处理
  const handlePrint = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      setIsProcessing(true);
      // const scaledCanvas = createHighResCanvas(canvas);

      canvas.toBlob(blob => {
        if (!blob) return;

        const url = URL.createObjectURL(blob);
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        printWindow.document.write(printTemplate(url));
        printWindow.document.close();

        printWindow.onload = () => {
          printWindow.print();
          URL.revokeObjectURL(url);
          setTimeout(printWindow.close, 1000);
        };
      }, 'image/png', 1);
    } catch (err) {
      console.error('打印失败:', err);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  useEffect(() => {
    processImage(props.file)
  }, [])

  return (
    <div className="flex w-52 h-52 justify-center items-center border border-solid border-orange-200 hover:border-orange-400 cursor-pointer relative" ref={containerRef}>
      {/* <div className="">
        <select
          value={selectedSize}
          onChange={(e) => setSelectedSize(e.target.value as PaperSizeKey)}
          disabled={isProcessing}
        >
          {Object.keys(PAPER_SIZES).map(size => (
            <option key={size} value={size}>{size}</option>
          ))}
        </select>

        <input
          type="file"
          accept="image/*"
          onChange={(e) => e.target.files?.[0] && processImage(e.target.files[0])}
          disabled={isProcessing}
        />

        <button
          onClick={handlePrint}
          disabled={isProcessing || !canvasRef.current}
        >
          {isProcessing ? '处理中...' : '打印照片'}
        </button>
      </div> */}
      <div className='absolute left-0 right-0 top-0 bottom-0 bg-black opacity-0 hover:opacity-25' />
      <canvas ref={canvasRef} className="bg-white shadow" />
    </div>
  );
}
