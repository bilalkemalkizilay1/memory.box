import exifr from 'exifr';

export class ImageUtils {
  static async compressImage(file: File, maxWidth = 1920, quality = 0.8): Promise<File> {
    if (!file.type.startsWith('image/')) return file;

    return new Promise(async (resolve) => {
      try {
        let orientation = 1;
        try {
          const exif = await exifr.parse(file, { tiff: true });
          if (exif && exif.Orientation) {
            orientation = exif.Orientation;
          }
        } catch (e) {
          console.warn('EXIF orientation read failed', e);
        }

        const img = new Image();
        const objectUrl = URL.createObjectURL(file);

        img.onload = () => {
          URL.revokeObjectURL(objectUrl);
          let { width, height } = img;
          
          if (width > maxWidth || height > maxWidth) {
            if (width > height) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxWidth) / height);
              height = maxWidth;
            }
          }

          const canvas = document.createElement('canvas');
          
          if (orientation >= 5 && orientation <= 8) {
            canvas.width = height;
            canvas.height = width;
          } else {
            canvas.width = width;
            canvas.height = height;
          }

          const ctx = canvas.getContext('2d');
          if (!ctx) return resolve(file);

          switch (orientation) {
            case 2: ctx.transform(-1, 0, 0, 1, width, 0); break;
            case 3: ctx.transform(-1, 0, 0, -1, width, height); break;
            case 4: ctx.transform(1, 0, 0, -1, 0, height); break;
            case 5: ctx.transform(0, 1, 1, 0, 0, 0); break;
            case 6: ctx.transform(0, 1, -1, 0, height, 0); break;
            case 7: ctx.transform(0, -1, -1, 0, height, width); break;
            case 8: ctx.transform(0, -1, 1, 0, 0, width); break;
            default: break;
          }

          ctx.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".webp", {
                  type: 'image/webp',
                  lastModified: Date.now()
                });
                resolve(compressedFile);
              } else {
                resolve(file);
              }
            },
            'image/webp',
            quality
          );
        };
        img.onerror = () => {
          URL.revokeObjectURL(objectUrl);
          resolve(file);
        };
        img.src = objectUrl;
      } catch (err) {
        resolve(file);
      }
    });
  }
}
