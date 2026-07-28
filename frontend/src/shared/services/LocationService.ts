export interface LocationResult {
  lat: number;
  lng: number;
  accuracy: number;
}

export class LocationService {
  /**
   * Retrieves the user's current GPS location via the browser's Geolocation API.
   * Prompts for permission if not already granted.
   */
  static async getCurrentLocation(): Promise<LocationResult> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Tarayıcınız konum servislerini desteklemiyor."));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: Math.round(position.coords.accuracy)
          });
        },
        (error) => {
          if (error.code === error.PERMISSION_DENIED) {
            reject(new Error("Konum izni reddedildi. Haritada gezerek manuel memory bırakabilirsiniz."));
          } else {
            reject(new Error("Konum belirlenirken hata oluştu."));
          }
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
      );
    });
  }
}
