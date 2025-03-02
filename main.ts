import { serveDirWithTs } from 'jsr:@ayame113/ts-serve';
import { crypto } from 'jsr:@std/crypto';

const CACHE_PATH = '.cache/cachedTiles.txt';
const FETCH_URL = 'https://overpass-api.de/api/interpreter';
const PROGRAM_VERSION = '0.3.2';

let cachedResponses: string[] = [];
try {
    cachedResponses = JSON.parse((await Deno.readTextFile(CACHE_PATH)) || '[]');
} catch (error) {
    if (error instanceof Deno.errors.NotFound) {
        await Deno.mkdir('.cache', { recursive: true });
        await Deno.writeTextFile(CACHE_PATH, '[]');
    } else {
        throw error;
    }
}

const headers = {
    'Content-Type': 'application/json',
    'Cache-Control': 'public, max-age=31536000, immutable',
};

Deno.serve({ port: 3000, hostname: '0.0.0.0' }, async (request: Request) => {
    if (request.url.includes('/api')) {
        const startServeTime = performance.now();
        const url = new URL(request.url);

        const latStart = url.searchParams.get('latStart');
        const lonStart = url.searchParams.get('lonStart');
        const latEnd = url.searchParams.get('latEnd');
        const lonEnd = url.searchParams.get('lonEnd');

        const req = new Request(FETCH_URL, {
            method: 'POST',
            body: 'data=' +
                encodeURIComponent(`[out:json][timeout:25];(way["highway"](${latStart},${lonStart},${latEnd},${lonEnd}););out geom;`),
        });

        const hashHex = await generateHash(req.url + `${latStart},${lonStart},${latEnd},${lonEnd}` + PROGRAM_VERSION);
        const cacheResponse = await isCacheAvailable(hashHex);

        if (!cacheResponse) {
            const result = await fetch(req).then((res) => res.json());
            const graph = convertToGraphData(result);
            const neighbors = getNeighborsFromEdges(graph.edges);

            const response = JSON.stringify({ graph, neighbors: Object.fromEntries(neighbors) });
            addToCache(hashHex, response);
            console.log('SERVED FROM WEB: ' + hashHex + ' in ' + (performance.now() - startServeTime) + 'ms');
            return new Response(response, { headers });
        } else {
            console.log('SERVED FROM CACHE: ' + hashHex + ' in ' + (performance.now() - startServeTime) + 'ms');
            return new Response(cacheResponse, { headers });
        }
    }
    return serveDirWithTs(request, { fsRoot: './public', showIndex: true });
});

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

type Point = { id: number; lat: number; lon: number };
type Edge = {
    id: number;
    from: Point;
    to: Point;
    highway: string;
    maxspeed: string;
    name: string;
    oneway: boolean;
    junction: boolean;
};

function convertToGraphData(result: any) {
    const points: Point[] = [];
    const edges: Edge[] = [];

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
                if (from && to) {
                    edges.push({
                        id: element.id,
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
    }

    return { points, edges };
}
function isCarAllowedBasedOnType(type: string): boolean {
    if (
        type === 'pedestrian' ||
        type === 'footway' ||
        type === 'path' ||
        type === 'steps' ||
        type === 'cycleway' ||
        type === 'bus_guideway' ||
        type === 'busway'
    ) {
        return false;
    }
    return true;
}

function getNeighbors(data: any) {
    const neighbors = new Map<number, Point[]>();
    // console.log(data.elements.forEach((element: any) => element.tags.highway));
    const ways = data.elements.filter(
        (element: any) =>
            element.type === 'way' &&
            isCarAllowedBasedOnType(element.tags.highway) &&
            !(element.tags.oneway == 'yes') &&
            !(element.tags.junction == 'roundabout'),
    );
    // oneway junction
    for (const way of ways) {
        for (let i = 0; i < way.nodes.length - 1; i++) {
            const from = way.nodes[i];
            const to = way.nodes[i + 1];
            if (!neighbors.has(from)) {
                neighbors.set(from, []);
            }
            if (!neighbors.has(to)) {
                neighbors.set(to, []);
            }
            neighbors.get(from)?.push({ id: to, lat: way.geometry[i + 1].lat, lon: way.geometry[i + 1].lon });
            neighbors.get(to)?.push({ id: from, lat: way.geometry[i].lat, lon: way.geometry[i].lon });
        }
    }
    return neighbors;
}
function getNeighborsFromEdges(edges: Edge[]) {
    const neighbors = new Map<number, Point[]>();
    const filteredEdges = edges.filter((edge) => isCarAllowedBasedOnType(edge.highway));
    for (const edge of filteredEdges) {
        if (!neighbors.has(edge.from.id)) {
            neighbors.set(edge.from.id, []);
        }
        neighbors.get(edge.from.id)?.push(edge.to);
        if (!edge.oneway && !edge.junction) {
            if (!neighbors.has(edge.to.id)) {
                neighbors.set(edge.to.id, []);
            }
            neighbors.get(edge.to.id)?.push(edge.from);
        }
    }
    return neighbors;
}
