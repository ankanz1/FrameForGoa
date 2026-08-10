import { removeBackground as removeBackgroundWithModel } from '@imgly/background-removal';

const cache = new Map<string, Promise<string>>();

export function removeBackground(imageSrc: string): Promise<string> {
  const cached = cache.get(imageSrc);
  if (cached) return cached;

  const result = removeBackgroundWithModel(imageSrc).then((blob) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error ?? new Error('Could not read cutout image'));
      reader.readAsDataURL(blob);
    })
  );

  cache.set(imageSrc, result);
  return result;
}
