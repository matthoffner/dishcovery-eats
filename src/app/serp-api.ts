export default async function fetchSerpApiData(
  engine: string, // 'google_local' or 'yelp'
  q: string, // Search term or description
  location: string,
  apiKey: string,
  cflt?: string, // Optional parameter for Yelp category filter
  sortby?: string, // Optional parameter for Yelp sorting
  attrs?: string[] // Optional array parameter for Yelp additional attributes
): Promise<any> {
  const url = new URL('https://serpapi.com/search');

  // Adding query parameters
  url.searchParams.append('engine', engine);

  if (engine === 'yelp') {
    url.searchParams.append('find_desc', q);
    url.searchParams.append('find_loc', location);

    // Adding optional parameters for Yelp
    if (cflt) url.searchParams.append('cflt', cflt);
    if (sortby) url.searchParams.append('sortby', sortby);
    if (attrs && attrs.length > 0) {
      attrs.forEach((attr) => url.searchParams.append('attrs', attr));
    }
  } else {
    url.searchParams.append('q', q);
    url.searchParams.append('location', location);
  }

  url.searchParams.append('api_key', apiKey);

  try {
    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('There has been a problem with your fetch operation:', error);
  }
}
