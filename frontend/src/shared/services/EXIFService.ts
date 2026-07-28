import exifr from 'exifr';

export interface PhotoMetadata {
  lat?: number;
  lng?: number;
  date?: string;
  orientation?: number;
}

export class EXIFService {
  /**
   * Extracts GPS, date, and orientation from a given photo file.
   * Uses both exifr.gps() and exifr.parse() for maximum reliability.
   */
  static async extractMetadata(file: File): Promise<PhotoMetadata> {
    try {
      // 1. Try dedicated GPS parsing first
      const gps = await exifr.gps(file).catch(() => null);

      // 2. Parse general EXIF data
      const output = await exifr.parse(file, {
        gps: true,
        exif: true,
        tiff: true,
        reviveValues: true
      }).catch(() => null);

      const metadata: PhotoMetadata = {};

      const lat = gps?.latitude ?? output?.latitude;
      const lng = gps?.longitude ?? output?.longitude;

      if (typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng)) {
        metadata.lat = lat;
        metadata.lng = lng;
      }

      const rawDate = output?.DateTimeOriginal || output?.CreateDate;
      if (rawDate) {
        try {
          metadata.date = new Date(rawDate).toISOString();
        } catch {
          // If date parsing fails, skip date
        }
      }

      if (output?.Orientation) {
        metadata.orientation = output.Orientation;
      }

      return metadata;
    } catch (error) {
      console.warn("EXIFService: Failed to extract metadata", error);
      return {};
    }
  }
}

