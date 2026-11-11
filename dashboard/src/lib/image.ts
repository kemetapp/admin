/** أدوات الصور: قص مربع + ضغط + تحويل لـbase64 (يُحفظ داخل Firestore). */

export function drawSquare(
  source: { width: number; height: number },
  size: number,
  quality: number,
): string {
  const side = Math.min(source.width, source.height);
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('canvas');
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  context.drawImage(
    source as CanvasImageSource,
    (source.width - side) / 2,
    (source.height - side) / 2,
    side,
    side,
    0,
    0,
    size,
    size,
  );

  let dataUrl = canvas.toDataURL('image/jpeg', quality);
  let next = quality;
  while (dataUrl.length > 120_000 && next > 0.3) {
    next -= 0.1;
    dataUrl = canvas.toDataURL('image/jpeg', next);
  }
  return dataUrl;
}

export async function compressFile(file: File, size = 256, quality = 0.7): Promise<string> {
  const bitmap = await createImageBitmap(file);
  return drawSquare(bitmap, size, quality);
}

export function recompressDataUrl(dataUrl: string, size = 256, quality = 0.7): Promise<string> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      try {
        resolve(drawSquare(image, size, quality));
      } catch (error) {
        reject(error);
      }
    };
    image.onerror = () => reject(new Error('decode'));
    image.src = dataUrl;
  });
}

/** رابط صورة مش قابل للتحميل (معاينات جوجل وغيرها). */
export const isBadImageUrl = (url: string) =>
  Boolean(url) &&
  !url.startsWith('data:image') &&
  !/\.(jpe?g|png|webp|gif|avif)(\?.*)?$/i.test(url);
