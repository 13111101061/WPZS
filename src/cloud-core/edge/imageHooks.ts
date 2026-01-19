/**
 * 边缘图片处理 React Hooks
 */

import { useState, useCallback } from 'react';
import { edgeImageProcessor } from './EdgeImageProcessor';
import { ImageFormat, IImageConvertOptions, IImageCropOptions, IImageResizeOptions, IImageProcessResult } from './EdgeImageProcessor';

/**
 * 使用图片格式转换的 Hook
 */
export function useImageConvert() {
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<IImageProcessResult | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const convert = useCallback(async (
    imageBlob: Blob,
    options: IImageConvertOptions
  ) => {
    setProcessing(true);
    setError(null);

    try {
      const res = await edgeImageProcessor.convertImage(imageBlob, options);
      setResult(res);
      return res;
    } catch (err) {
      const error = err as Error;
      setError(error);
      throw error;
    } finally {
      setProcessing(false);
    }
  }, []);

  return {
    processing,
    progress,
    result,
    error,
    convert,
  };
}

/**
 * 使用图片裁剪的 Hook
 */
export function useImageCrop() {
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<IImageProcessResult | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const crop = useCallback(async (
    imageBlob: Blob,
    options: IImageCropOptions
  ) => {
    setProcessing(true);
    setError(null);

    try {
      const res = await edgeImageProcessor.cropImage(imageBlob, options);
      setResult(res);
      return res;
    } catch (err) {
      const error = err as Error;
      setError(error);
      throw error;
    } finally {
      setProcessing(false);
    }
  }, []);

  return {
    processing,
    result,
    error,
    crop,
  };
}

/**
 * 使用图片缩放的 Hook
 */
export function useImageResize() {
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<IImageProcessResult | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const resize = useCallback(async (
    imageBlob: Blob,
    options: IImageResizeOptions
  ) => {
    setProcessing(true);
    setError(null);

    try {
      const res = await edgeImageProcessor.resizeImage(imageBlob, options);
      setResult(res);
      return res;
    } catch (err) {
      const error = err as Error;
      setError(error);
      throw error;
    } finally {
      setProcessing(false);
    }
  }, []);

  return {
    processing,
    result,
    error,
    resize,
  };
}

/**
 * 使用图片信息的 Hook
 */
export function useImageInfo() {
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState<{
    width: number;
    height: number;
    size: number;
    type: string;
  } | null>(null);

  const getInfo = useCallback(async (imageBlob: Blob) => {
    setLoading(true);
    try {
      const data = await edgeImageProcessor.getImageInfo(imageBlob);
      setInfo(data);
      return data;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    info,
    getInfo,
  };
}

/**
 * 使用批量图片处理的 Hook
 */
export function useBatchImageProcess() {
  const [processing, setProcessing] = useState(false);
  const [current, setCurrent] = useState(0);
  const [total, setTotal] = useState(0);
  const [results, setResults] = useState<IImageProcessResult[]>([]);

  const process = useCallback(async (
    images: Array<{ blob: Blob; operation: 'convert' | 'crop' | 'resize'; options: any }>
  ) => {
    setProcessing(true);
    setCurrent(0);
    setTotal(images.length);
    setResults([]);

    try {
      const res = await edgeImageProcessor.batchProcess(images, (curr, tot) => {
        setCurrent(curr);
        setTotal(tot);
      });

      setResults(res);
      return res;
    } finally {
      setProcessing(false);
    }
  }, []);

  return {
    processing,
    current,
    total,
    progress: total > 0 ? current / total : 0,
    results,
    process,
  };
}

/**
 * 使用完整图片处理功能的 Hook
 */
export function useImageProcessing() {
  const convert = useImageConvert();
  const crop = useImageCrop();
  const resize = useImageResize();
  const info = useImageInfo();
  const batch = useBatchImageProcess();

  return {
    convert,
    crop,
    resize,
    info,
    batch,
    processing: convert.processing || crop.processing || resize.processing || batch.processing,
  };
}
