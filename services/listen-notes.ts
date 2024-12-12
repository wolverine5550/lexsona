export class ListenNotesClient {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async search({
    q,
    type,
    language,
    len_min,
    len_max
  }: {
    q: string;
    type: string;
    language: string;
    len_min: number;
    len_max: number;
  }) {
    const response = await fetch(
      `https://listen-api.listennotes.com/api/v2/search?q=${q}&type=${type}&language=${language}&len_min=${len_min}&len_max=${len_max}`,
      {
        headers: {
          'X-ListenAPI-Key': this.apiKey
        }
      }
    );

    return response.json();
  }
}
