import React, { useState, useRef, useEffect } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Upload, Image as ImageIcon } from 'lucide-react';
import heic2any from 'heic2any';
import { CropArea } from '../types';

interface PhotoCropperProps {
  imageSrc: string | null;
  onImageChange: (src: string | null) => void;
  onCropChange: (crop: CropArea) => void;
}

export const PhotoCropper: React.FC<PhotoCropperProps> = ({
  imageSrc,
  onImageChange,
  onCropChange,
}) => {
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isLoading, setIsLoading] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Reset zoom & pan when image changes
  useEffect(() => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  }, [imageSrc]);

  // Recalculate crop area when scale, offset or imageSrc changes
  useEffect(() => {
    if (!imageRef.current || !imageSrc) return;

    const img = imageRef.current;
    if (!img.naturalWidth || !img.naturalHeight) return;

    // Calculate normalized crop coordinates relative to natural image dimensions
    const container = containerRef.current;
    if (!container) return;

    const containerW = container.clientWidth;
    const containerH = container.clientHeight;

    // Display image size within container
    const baseScale = Math.min(
      containerW / img.naturalWidth,
      containerH / img.naturalHeight
    );

    const displayedWidth = img.naturalWidth * baseScale * scale;
    const displayedHeight = img.naturalHeight * baseScale * scale;

    // Center point relative to natural image
    const cropWidth = img.naturalWidth / scale;
    const cropHeight = img.naturalHeight / scale;

    // Center offset converted to natural coordinates
    const sx = Math.max(
      0,
      Math.min(
        img.naturalWidth - cropWidth,
        (img.naturalWidth - cropWidth) / 2 - (offset.x / (baseScale * scale))
      )
    );

    const sy = Math.max(
      0,
      Math.min(
        img.naturalHeight - cropHeight,
        (img.naturalHeight - cropHeight) / 2 - (offset.y / (baseScale * scale))
      )
    );

    onCropChange({
      x: sx,
      y: sy,
      width: Math.min(cropWidth, img.naturalWidth),
      height: Math.min(cropHeight, img.naturalHeight),
    });
  }, [scale, offset, imageSrc]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);

    try {
      let processFile: File | Blob = file;

      // Convert HEIC if uploaded from iOS
      if (
        file.type === 'image/heic' ||
        file.type === 'image/heif' ||
        file.name.toLowerCase().endsWith('.heic')
      ) {
        const converted = await heic2any({
          blob: file,
          toType: 'image/jpeg',
          quality: 0.9,
        });
        processFile = Array.isArray(converted) ? converted[0] : converted;
      }

      const reader = new FileReader();
      reader.onload = () => {
        onImageChange(reader.result as string);
        setIsLoading(false);
      };
      reader.readAsDataURL(processFile);
    } catch (err) {
      console.error('Error processing image upload', err);
      // Fallback direct read
      const reader = new FileReader();
      reader.onload = () => {
        onImageChange(reader.result as string);
        setIsLoading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!imageSrc) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleReset = () => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  };

  return (
    <div className="bg-[#084f2b] rounded-2xl p-5 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-playfair text-xl font-bold text-[#fef6e4] flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-[#f3c048]" />
          1. Photo Upload & Position
        </h3>

        <label className="cursor-pointer bg-[#f3c048] hover:bg-[#e2b13b] text-[#08140e] font-bold px-4 py-2 rounded-xl text-sm transition flex items-center gap-2 shadow-md">
          <Upload className="w-4 h-4" />
          {imageSrc ? 'Change Photo' : 'Upload Photo'}
          <input
            type="file"
            accept="image/*,.heic,.heif"
            onChange={handleFileUpload}
            className="hidden"
          />
        </label>
      </div>

      {/* Interactive Drag & Crop Canvas */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="relative w-full h-72 bg-[#08140e] rounded-xl overflow-hidden border-2 border-dashed border-[#22503a] flex items-center justify-center cursor-grab active:cursor-grabbing select-none"
      >
        {isLoading ? (
          <div className="text-center p-6 text-[#94a3b8]">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#f3c048] border-t-transparent mb-2"></div>
            <p className="text-sm">Processing photo...</p>
          </div>
        ) : imageSrc ? (
          <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
            <img
              ref={imageRef}
              src={imageSrc}
              alt="Uploaded Avatar"
              onLoad={() => {
                // Trigger recalculation on load
                setScale(scale);
              }}
              style={{
                transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
                transition: isDragging ? 'none' : 'transform 0.1s ease-out',
                maxHeight: '100%',
                maxWidth: '100%',
                objectFit: 'contain',
              }}
              className="pointer-events-none"
            />

            {/* Target Crop Circle Overlay Guide */}
            <div className="absolute inset-0 border-2 border-[#f3c048]/50 rounded-full pointer-events-none max-w-[220px] max-h-[220px] m-auto shadow-[0_0_0_9999px_rgba(8,20,14,0.6)]" />
          </div>
        ) : (
          <div className="text-center p-6">
            <div className="w-16 h-16 bg-[#163627] rounded-full flex items-center justify-center mx-auto mb-3 text-[#f3c048]">
              <Upload className="w-8 h-8" />
            </div>
            <p className="text-[#fef6e4] font-medium mb-1">Drag & drop or click Upload</p>
            <p className="text-xs text-[#94a3b8]">Supports JPG, PNG, HEIC from iPhone</p>
          </div>
        )}
      </div>

      {/* Zoom & Reset Controls */}
      {imageSrc && (
        <div className="flex items-center gap-4 mt-4 bg-[#08140e] p-3 rounded-xl border border-[#1b3d2c]">
          <div className="flex items-center gap-2 text-xs text-[#94a3b8] font-mono">
            <ZoomOut className="w-4 h-4 text-[#f3c048]" />
            <input
              type="range"
              min="0.8"
              max="3"
              step="0.05"
              value={scale}
              onChange={(e) => setScale(parseFloat(e.target.value))}
              className="w-32 accent-[#f3c048] cursor-pointer"
            />
            <ZoomIn className="w-4 h-4 text-[#f3c048]" />
          </div>

          <button
            onClick={handleReset}
            className="ml-auto text-xs text-[#94a3b8] hover:text-[#fef6e4] flex items-center gap-1 bg-[#143827] px-3 py-1.5 rounded-lg transition"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset Position
          </button>
        </div>
      )}
    </div>
  );
};
