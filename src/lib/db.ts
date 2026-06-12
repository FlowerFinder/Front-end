// In-browser analytical database: DuckDB-WASM querying the parquet dataset
// served from /data/. No backend — the .parquet files ARE the database.
import * as duckdb from '@duckdb/duckdb-wasm';
import type { Plant } from '@/types';

let dbPromise: Promise<duckdb.AsyncDuckDBConnection> | null = null;

async function init(): Promise<duckdb.AsyncDuckDBConnection> {
  const bundles = duckdb.getJsDelivrBundles();
  const bundle = await duckdb.selectBundle(bundles);
  const workerUrl = URL.createObjectURL(
    new Blob([`importScripts("${bundle.mainWorker}");`], { type: 'text/javascript' })
  );
  const worker = new Worker(workerUrl);
  const db = new duckdb.AsyncDuckDB(new duckdb.VoidLogger(), worker);
  await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
  URL.revokeObjectURL(workerUrl);

  const conn = await db.connect();
  const base = window.location.origin + import.meta.env.BASE_URL;
  await conn.query(`
    CREATE VIEW plants AS SELECT * FROM read_parquet('${base}data/plants.parquet');
    CREATE VIEW embeddings AS SELECT * FROM read_parquet('${base}data/plant_embeddings.parquet');
  `);
  return conn;
}

export function getConnection(): Promise<duckdb.AsyncDuckDBConnection> {
  dbPromise ??= init();
  return dbPromise;
}

// Arrow rows -> Plant objects (lists arrive as Arrow vectors, size was flattened)
function rowToPlant(r: Record<string, unknown>): Plant {
  const list = (v: unknown): string[] => (v ? Array.from(v as ArrayLike<string>) : []);
  return {
    id: r.id,
    name: r.name,
    scientificName: r.scientificName,
    description: r.description,
    price: r.price,
    originalPrice: r.originalPrice ?? undefined,
    image: r.image_file
      ? `${import.meta.env.BASE_URL}data/images/${r.image_file}`
      : (r.image as string),
    category: r.category,
    tags: list(r.tags),
    careLevel: r.careLevel,
    environment: list(r.environment),
    petFriendly: Boolean(r.petFriendly),
    stock: Number(r.stock),
    isAvailable: Boolean(r.isAvailable),
    climate: list(r.climate),
    sunlight: r.sunlight,
    wateringFrequency: r.wateringFrequency,
    benefits: list(r.benefits),
    size: { height: (r.size_height as string) ?? '', width: (r.size_width as string) ?? '' },
    tenantId: r.tenantId,
  } as Plant;
}

// O tenant 'default' (FlowerFinder) é a vitrine demo: não possui plantas
// próprias, então mostra o catálogo inteiro.
function tenantFilter(tenantId: string, col = 'tenantId'): string {
  if (tenantId === 'default') return 'TRUE';
  return `${col} = '${tenantId.replace(/'/g, "''")}'`;
}

export async function fetchPlantsByTenant(tenantId: string): Promise<Plant[]> {
  const conn = await getConnection();
  const result = await conn.query(`SELECT * FROM plants WHERE ${tenantFilter(tenantId)}`);
  return result.toArray().map((row) => rowToPlant(row.toJSON()));
}

export interface VectorHit {
  plant: Plant;
  similarity: number; // cosine similarity in [-1, 1]
}

/** Semantic search: rank a tenant's plants against a query embedding (384-d e5). */
export async function searchByTextEmbedding(
  queryEmb: number[] | Float32Array,
  tenantId: string,
  limit = 12
): Promise<VectorHit[]> {
  const conn = await getConnection();
  const vec = Array.from(queryEmb).join(',');
  const result = await conn.query(`
    SELECT p.*, array_cosine_similarity(e.text_emb::FLOAT[384], [${vec}]::FLOAT[384]) AS similarity
    FROM plants p JOIN embeddings e USING (id)
    WHERE ${tenantFilter(tenantId, 'p.tenantId')}
    ORDER BY similarity DESC
    LIMIT ${Math.floor(limit)}
  `);
  return result.toArray().map((row) => {
    const r = row.toJSON();
    return { plant: rowToPlant(r), similarity: Number(r.similarity) };
  });
}

/** Visual similarity: plants whose photos look like the given plant's photo (CLIP space). */
export async function findVisuallySimilar(plantId: string, limit = 4): Promise<VectorHit[]> {
  const conn = await getConnection();
  const id = plantId.replace(/'/g, "''");
  const result = await conn.query(`
    SELECT p.*, array_cosine_similarity(
             e.img_emb::FLOAT[512],
             (SELECT img_emb::FLOAT[512] FROM embeddings WHERE id = '${id}')
           ) AS similarity
    FROM plants p JOIN embeddings e USING (id)
    WHERE p.id != '${id}'
    ORDER BY similarity DESC
    LIMIT ${Math.floor(limit)}
  `);
  return result.toArray().map((row) => {
    const r = row.toJSON();
    return { plant: rowToPlant(r), similarity: Number(r.similarity) };
  });
}
