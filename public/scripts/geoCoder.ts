export class geoCoder {
  url: string;
  constructor() {
    this.url = 'https://photon.komoot.io/api/?q=';
  }

  async run(query: string) {
    try {
      const response = await fetch(this.url + encodeURIComponent(query));
      if (!response.ok) {
        throw new Error(`respons fejlkode: ${response.statusText}`);
      }
      const data = await response.json();
      console.log('Geocode response:', data); // Print the response

      if (data.features && data.features.length > 0) {
        const { coordinates } = data.features[0].geometry;
        const [x, y] = coordinates;
        return { x, y };
      } else {
        throw new Error('No results found');
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      throw error;
    }
  }
}
