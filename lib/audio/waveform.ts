export interface WaveformData {
  /** picos normalizados 0-1, um valor por "coluna" da waveform */
  peaks: Float32Array;
  duration: number;
  sampleCount: number;
}

/**
 * Decodifica o ficheiro de áudio UMA vez com a Web Audio API e produz um
 * array de picos (min/max agregados por bucket). A timeline usa este array
 * diretamente ao desenhar (não recalcula a waveform a cada frame — secção 14).
 */
export async function generateWaveform(file: File, buckets = 2000): Promise<WaveformData> {
  const arrayBuffer = await file.arrayBuffer();
  const AudioContextClass: typeof AudioContext =
    (window as unknown as { AudioContext: typeof AudioContext; webkitAudioContext?: typeof AudioContext })
      .AudioContext ??
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const audioCtx = new AudioContextClass();

  try {
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer.slice(0));
    const channelData = audioBuffer.getChannelData(0);
    const samplesPerBucket = Math.max(1, Math.floor(channelData.length / buckets));
    const peaks = new Float32Array(buckets);

    for (let i = 0; i < buckets; i++) {
      const start = i * samplesPerBucket;
      const end = Math.min(start + samplesPerBucket, channelData.length);
      let max = 0;
      for (let j = start; j < end; j++) {
        const abs = Math.abs(channelData[j]!);
        if (abs > max) max = abs;
      }
      peaks[i] = max;
    }

    return { peaks, duration: audioBuffer.duration, sampleCount: buckets };
  } finally {
    await audioCtx.close();
  }
}
