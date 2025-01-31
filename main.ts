import { serveDirWithTs } from 'jsr:@ayame113/ts-serve';
import { crypto } from "jsr:@std/crypto";


Deno.serve(async (request: Request) => {
  if (request.url.includes('/api')) {
    // https://jsr.io/@std/cache
    const fetchURL = "https://overpass-api.de/api/interpreter";
    //get body of request
    const body = await request.text(); // overpass query

    const req = new Request(fetchURL, {
      method: "POST",
      body,
    });

    const response = await cachedFetch(req, body);

    return response;
  }
  // Serve directory if not an API request
  return serveDirWithTs(request, {
    fsRoot: './public',
    showIndex: true,
  });
});

await Deno.mkdir('.cache', { recursive: true });
await Deno.writeTextFile('.cache/cachedTiles.txt', '');
const cachePath = '.cache/cachedTiles.txt';

async function cachedFetch(req: Request, body: string) {
  const key = encodeURIComponent(req.url + body);
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  
  const hashBuffer = await crypto.subtle.digest("md5", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  const cacheResp = await isCacheAvailable(hashHex);

  if (cacheResp === undefined) {
    const resp = await fetch(req);
    const respClone = resp.clone();
    // save in cache
    // save a file in the .cache folder with the hash as the filename
    Deno.writeTextFile(`.cache/${hashHex}.json`, JSON.stringify(await respClone.json()));
    //append the hash to the cache file
    Deno.writeTextFile(cachePath, `${hashHex}\n`, { append: true });
    console.log('SERVED FROM WEB: ' + hashHex);
    return resp;
  } else {
    console.log('SERVED FROM CACHE: ' + hashHex);
    return new Response(cacheResp, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
  
}

async function isCacheAvailable(hashHex: string) {
  const cache = await Deno.readTextFile(cachePath);
  const cacheLines = cache.split('\n');
  const isInCache = cacheLines.find(line => line.startsWith(hashHex)) ? true : false;
  if (isInCache) {
    return await Deno.readTextFile(`.cache/${hashHex}.json`);
  }
  return undefined;
}
