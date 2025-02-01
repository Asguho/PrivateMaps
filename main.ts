import { serveDirWithTs } from 'jsr:@ayame113/ts-serve';
import { crypto } from 'jsr:@std/crypto';

const CACHE_PATH = '.cache/cachedTiles.txt';
const FETCH_URL = 'https://overpass-api.de/api/interpreter';
const PROGRAM_VERSION = '0.1.0';

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
  const hashHex = await generateHash(req.url + body + PROGRAM_VERSION);
  const cacheResp = await isCacheAvailable(hashHex);

  if (cacheResp) {
    console.log('SERVED FROM CACHE: ' + hashHex);
    return new Response(cacheResp, { headers: { 'Content-Type': 'application/json' } });
  } else {
    const resp = await fetch(req).then((res) => res.json());
    Deno.writeTextFile(`.cache/${hashHex}.json`, JSON.stringify(resp));
    cachedResponses.push(hashHex);
    Deno.writeTextFile(CACHE_PATH, JSON.stringify(cachedResponses));
    console.log('SERVED FROM WEB: ' + hashHex);
    return Response.json(resp);
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
    return await Deno.readTextFile(`.cache/${hashHex}.json`);
  }
  return undefined;
}
