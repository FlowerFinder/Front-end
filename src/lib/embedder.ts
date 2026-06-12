// In-browser query embedding with transformers.js.
// Same model family as data/embed.py (multilingual-e5-small) so query vectors
// land in the same space as the precomputed catalog vectors.
import { pipeline, type FeatureExtractionPipeline } from '@huggingface/transformers';

const MODEL = 'Xenova/multilingual-e5-small';

let extractorPromise: Promise<FeatureExtractionPipeline> | null = null;

export function loadEmbedder(onProgress?: (pct: number) => void) {
  extractorPromise ??= pipeline('feature-extraction', MODEL, {
    dtype: 'q8',
    progress_callback: (p: { status?: string; progress?: number }) => {
      if (p.status === 'progress' && typeof p.progress === 'number') onProgress?.(p.progress);
    },
  });
  return extractorPromise;
}

/** Embed a user query (E5 "query: " prefix), L2-normalized, 384-d. */
export async function embedQuery(text: string): Promise<Float32Array> {
  const extractor = await loadEmbedder();
  const output = await extractor(`query: ${text}`, { pooling: 'mean', normalize: true });
  return output.data as Float32Array;
}
