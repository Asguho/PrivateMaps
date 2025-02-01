import { serveDirWithTs } from 'jsr:@ayame113/ts-serve';
import { crypto } from 'jsr:@std/crypto';

const CACHE_PATH = '.cache/cachedTiles.txt';
const FETCH_URL = 'https://overpass-api.de/api/interpreter';
const PROGRAM_VERSION = '0.2.1';

let cachedResponses: string[] = [];
try {
  cachedResponses = JSON.parse((await Deno.readTextFile(CACHE_PATH)) || '[]');
} catch (error) {
  if (error instanceof Deno.errors.NotFound) {
    await Deno.writeTextFile(CACHE_PATH, '[]');
  } else {
    throw error;
  }
}

await Deno.mkdir('.cache', { recursive: true });

Deno.serve(async (request: Request) => {
  if (request.url.includes('/api')) {
    const body = await request.text();
    const req = new Request(FETCH_URL, { method: 'POST', body });
    return await cachedFetch(req, body);
  }
  return serveDirWithTs(request, { fsRoot: './public', showIndex: true });
});

async function cachedFetch(req: Request, body: string) {
  const headers = {
    'Content-Type': 'application/json',
    'Cache-Control': 'public, max-age=31536000, immutable',
  };
  const hashHex = await generateHash(req.url + body + PROGRAM_VERSION);
  const cacheResponse = await isCacheAvailable(hashHex);

  if (!cacheResponse) {
    const result = await fetch(req).then((res) => res.json());
    const response = JSON.stringify(convertToGraphData(result));
    addToCache(hashHex, response);
    console.log('SERVED FROM WEB: ' + hashHex);
    return new Response(response, { headers });
  } else {
    console.log('SERVED FROM CACHE: ' + hashHex);
    return new Response(cacheResponse, { headers });
  }
}

async function generateHash(data: string) {
  const hashBuffer = await crypto.subtle.digest('md5', new TextEncoder().encode(data));
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function isCacheAvailable(hashHex: string) {
  if (cachedResponses.includes(hashHex)) {
    return (await Deno.open(`.cache/${hashHex}.json`)).readable;
  }
  return undefined;
}
function addToCache(hashHex: string, response: string) {
  cachedResponses.push(hashHex);
  Deno.writeTextFile(CACHE_PATH, JSON.stringify(cachedResponses));
  Deno.writeTextFile(`.cache/${hashHex}.json`, response);
}

function convertToGraphData(result: any) {
  const points = [];
  const edges = [];

  for (const element of result.elements) {
    if (element.type === 'node') {
      points.push({ id: element.id, lat: element.lat, lon: element.lon });
    }
  }

  for (const element of result.elements) {
    if (element.type === 'way') {
      for (let i = 0; i < element.geometry.length; i++) {
        const node = element.geometry[i];
        if (!points.find((point) => point.id === element.nodes[i])) {
          points.push({ id: element.nodes[i], lat: node.lat, lon: node.lon });
        }
      }
    }
  }

  for (const element of result.elements) {
    if (element.type === 'way') {
      for (let i = 0; i < element.nodes.length - 1; i++) {
        const from = points.find((point) => point.id === element.nodes[i]);
        const to = points.find((point) => point.id === element.nodes[i + 1]);
        edges.push({
          from: from,
          to: to,
          highway: element.tags.highway,
          maxspeed: element.tags.maxspeed,
          name: element.tags.name,
          oneway: element.tags.oneway === 'yes',
          junction: element.tags.junction === 'roundabout',
        });
      }
    }
  }

  return { points, edges };
}
