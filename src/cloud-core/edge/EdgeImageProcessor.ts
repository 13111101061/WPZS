/**
 * 边缘图片处理模块
 * 提供图片格式转换和裁剪功能
 */

/**
 * 支持的图片格式
 */
export enum ImageFormat {
  JPEG = 'jpeg',
  PNG = 'png',
  WEBP = 'webp',
  AVIF = 'avif',
  GIF = 'gif',
  BMP = 'bmp',
  TIFF = 'tiff',
  ICO = 'ico',
}

/**
 * 图片质量选项
 */
export interface IImageQuality {
  quality: number;              // 1-100
  lossless: boolean;            // 无损压缩
}

/**
 * 图片转换选项
 */
export interface IImageConvertOptions {
  format: ImageFormat;
  quality?: number;             // 1-100，默认 85
  lossless?: boolean;           // 无损模式
  stripMetadata?: boolean;     // 移除元数据
}

/**
 * 图片裁剪选项
 */
export interface IImageCropOptions {
  x: number;                    // 左上角 X 坐标
  y: number;                    // 左上角 Y 坐标
  width: number;                // 宽度
  height: number;               // 高度
}

/**
 * 图片缩放选项
 */
export interface IImageResizeOptions {
  width?: number;               // 目标宽度
  height?: number;              // 目标高度
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';  // 适配模式
  quality?: number;             // 1-100
}

/**
 * 图片处理结果
 */
export interface IImageProcessResult {
  success: boolean;
  originalSize: number;         // 原始大小（字节）
  processedSize: number;       // 处理后大小（字节）
  compression: number;         // 压缩率（0-1）
  width: number;                // 宽度
  height: number;               // 高度
  format: string;               // 格式
  url?: string;                 // 结果 URL（如果是异步处理）
  data?: Blob;                 // 结果数据
  processingTime: number;      // 处理时间（毫秒）
  error?: string;               // 错误信息
}

/**
 * 边缘图片处理函数配置
 */
export interface IImageFunctionConfig {
  id: string;
  name: string;
  runtime: 'javascript' | 'wasm';
  memory: number;
  timeout: number;
  regions: string[];
  enableCache: boolean;
  cacheTTL?: number;
}

/**
 * 边缘图片处理器类
 */
export class EdgeImageProcessor {
  private static instance: EdgeImageProcessor;
  private functionCache: Map<string, string> = new Map();

  private constructor() {
    // 私有构造函数
  }

  /**
   * 获取单例实例
   */
  public static getInstance(): EdgeImageProcessor {
    if (!EdgeImageProcessor.instance) {
      EdgeImageProcessor.instance = new EdgeImageProcessor();
    }
    return EdgeImageProcessor.instance;
  }

  /**
   * 转换图片格式
   */
  async convertImage(
    imageBlob: Blob,
    options: IImageConvertOptions
  ): Promise<IImageProcessResult> {
    const startTime = Date.now();
    const originalSize = imageBlob.size;

    try {
      // 创建 Image 对象
      const bitmap = await createImageBitmap(imageBlob);

      // 准备 Canvas
      const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
      const ctx = canvas.getContext('2d')!;

      // 绘制图片
      ctx.drawImage(bitmap, 0, 0);

      // 转换为目标格式
      const mimeType = this.getMimeType(options.format);
      let quality = options.quality ?? 85;

      // 处理无损模式
      if (options.lossless && options.format === ImageFormat.PNG) {
        quality = 1.0;
      }

      // 转换
      const data = await canvas.convertToBlob({
        type: mimeType,
        quality: quality / 100,
      });

      return {
        success: true,
        originalSize,
        processedSize: data.size,
        compression: 1 - (data.size / originalSize),
        width: bitmap.width,
        height: bitmap.height,
        format: options.format,
        data,
        processingTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        originalSize,
        processedSize: 0,
        compression: 0,
        width: 0,
        height: 0,
        format: options.format,
        processingTime: Date.now() - startTime,
        error: (error as Error).message,
      };
    }
  }

  /**
   * 裁剪图片
   */
  async cropImage(
    imageBlob: Blob,
    options: IImageCropOptions
  ): Promise<IImageProcessResult> {
    const startTime = Date.now();
    const originalSize = imageBlob.size;

    try {
      const bitmap = await createImageBitmap(imageBlob);

      // 创建裁剪后的 Canvas
      const canvas = new OffscreenCanvas(options.width, options.height);
      const ctx = canvas.getContext('2d')!;

      // 裁剪
      ctx.drawImage(
        bitmap,
        options.x, options.y, options.width, options.height,  // 源矩形
        0, 0, options.width, options.height                      // 目标矩形
      );

      // 转换回 Blob
      const data = await canvas.convertToBlob({ type: imageBlob.type });

      return {
        success: true,
        originalSize,
        processedSize: data.size,
        compression: 0,
        width: options.width,
        height: options.height,
        format: imageBlob.type.split('/')[1] || 'unknown',
        data,
        processingTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        originalSize,
        processedSize: 0,
        compression: 0,
        width: options.width,
        height: options.height,
        format: 'unknown',
        processingTime: Date.now() - startTime,
        error: (error as Error).message,
      };
    }
  }

  /**
   * 缩放图片
   */
  async resizeImage(
    imageBlob: Blob,
    options: IImageResizeOptions
  ): Promise<IImageProcessResult> {
    const startTime = Date.now();
    const originalSize = imageBlob.size;

    try {
      const bitmap = await createImageBitmap(imageBlob);

      // 计算目标尺寸
      const targetSize = this.calculateTargetSize(
        bitmap.width,
        bitmap.height,
        options
      );

      // 创建缩放后的 Canvas
      const canvas = new OffscreenCanvas(targetSize.width, targetSize.height);
      const ctx = canvas.getContext('2d')!;

      // 启用高质量缩放
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // 绘制缩放后的图片
      ctx.drawImage(bitmap, 0, 0, targetSize.width, targetSize.height);

      // 转换回 Blob
      const data = await canvas.convertToBlob({
        type: imageBlob.type,
        quality: (options.quality ?? 85) / 100,
      });

      return {
        success: true,
        originalSize,
        processedSize: data.size,
        compression: 1 - (data.size / originalSize),
        width: targetSize.width,
        height: targetSize.height,
        format: imageBlob.type.split('/')[1] || 'unknown',
        data,
        processingTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        originalSize,
        processedSize: 0,
        compression: 0,
        width: 0,
        height: 0,
        format: 'unknown',
        processingTime: Date.now() - startTime,
        error: (error as Error).message,
      };
    }
  }

  /**
   * 获取图片信息
   */
  async getImageInfo(imageBlob: Blob): Promise<{
    width: number;
    height: number;
    size: number;
    type: string;
  } | null> {
    try {
      const bitmap = await createImageBitmap(imageBlob);
      return {
        width: bitmap.width,
        height: bitmap.height,
        size: imageBlob.size,
        type: imageBlob.type,
      };
    } catch {
      return null;
    }
  }

  /**
   * 批量处理图片
   */
  async batchProcess(
    images: Array<{ blob: Blob; operation: 'convert' | 'crop' | 'resize'; options: any }>,
    onProgress?: (current: number, total: number) => void
  ): Promise<IImageProcessResult[]> {
    const results: IImageProcessResult[] = [];

    for (let i = 0; i < images.length; i++) {
      const { blob, operation, options } = images[i];

      let result: IImageProcessResult;

      switch (operation) {
        case 'convert':
          result = await this.convertImage(blob, options);
          break;
        case 'crop':
          result = await this.cropImage(blob, options);
          break;
        case 'resize':
          result = await this.resizeImage(blob, options);
          break;
        default:
          result = {
            success: false,
            originalSize: blob.size,
            processedSize: 0,
            compression: 0,
            width: 0,
            height: 0,
            format: 'unknown',
            processingTime: 0,
            error: 'Unknown operation',
          };
      }

      results.push(result);

      // 调用进度回调
      if (onProgress) {
        onProgress(i + 1, images.length);
      }
    }

    return results;
  }

  /**
   * 部署图片处理函数到边缘
   */
  async deployImageFunction(
    config: IImageFunctionConfig
  ): Promise<string> {
    const functionCode = this.generateImageFunction();

    // 这里应该调用实际的边缘函数部署逻辑
    // 返回函数 ID
    const functionId = `image-processor-${Date.now()}`;

    this.functionCache.set(functionId, functionCode);

    return functionId;
  }

  /**
   * 生成图片处理函数代码
   */
  private generateImageFunction(): string {
    return `
export default {
  async fetch(request) {
    const url = new URL(request.url);
    const operation = url.searchParams.get('operation');
    const format = url.searchParams.get('format');
    const quality = parseInt(url.searchParams.get('quality') || '85');

    // 解析请求体
    const imageBuffer = await request.arrayBuffer();

    // 使用 Canvas API 处理图片
    const bitmap = await createImageBitmap(imageBuffer);
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(bitmap, 0, 0);

    // 转换格式
    const mimeType = format ? \`image/\${format}\` : 'image/jpeg';
    const blob = await canvas.convertToBlob({ type: mimeType, quality: quality / 100 });

    return new Response(blob, {
      headers: { 'Content-Type': mimeType },
    });
  }
};
    `.trim();
  }

  /**
   * 计算目标尺寸
   */
  private calculateTargetSize(
    originalWidth: number,
    originalHeight: number,
    options: IImageResizeOptions
  ): { width: number; height: number } {
    const aspectRatio = originalWidth / originalHeight;
    let width = options.width ?? originalWidth;
    let height = options.height ?? originalHeight;

    switch (options.fit || 'cover') {
      case 'contain':
        // 包含：完全显示图片，可能留白
        const targetAspectRatio = width / height;
        if (aspectRatio > targetAspectRatio) {
          width = height * aspectRatio;
        } else {
          height = width / aspectRatio;
        }
        break;

      case 'cover':
        // 覆盖：填满容器，可能裁剪
        const coverAspectRatio = width / height;
        if (aspectRatio > coverAspectRatio) {
          height = width / aspectRatio;
        } else {
          width = height * aspectRatio;
        }
        break;

      case 'fill':
        // 填充：拉伸到目标尺寸
        break;

      case 'inside':
        // 内部：不超过目标尺寸
        if (originalWidth > width || originalHeight > height) {
          return this.calculateTargetSize(originalWidth, originalHeight, {
            ...options,
            fit: 'contain',
          });
        }
        break;

      case 'outside':
        // 外部：至少达到目标尺寸
        if (originalWidth < width || originalHeight < height) {
          return this.calculateTargetSize(originalWidth, originalHeight, {
            ...options,
            fit: 'cover',
          });
        }
        break;
    }

    return { width, height };
  }

  /**
   * 获取 MIME 类型
   */
  private getMimeType(format: ImageFormat): string {
    const mimeTypes: Record<ImageFormat, string> = {
      [ImageFormat.JPEG]: 'image/jpeg',
      [ImageFormat.PNG]: 'image/png',
      [ImageFormat.WEBP]: 'image/webp',
      [ImageFormat.AVIF]: 'image/avif',
      [ImageFormat.GIF]: 'image/gif',
      [ImageFormat.BMP]: 'image/bmp',
      [ImageFormat.TIFF]: 'image/tiff',
      [ImageFormat.ICO]: 'image/x-icon',
    };

    return mimeTypes[format] || 'image/jpeg';
  }

  /**
   * 清理缓存
   */
  clearCache(): void {
    this.functionCache.clear();
  }
}

/**
 * 边缘图片处理器单例导出
 */
export const edgeImageProcessor = EdgeImageProcessor.getInstance();
