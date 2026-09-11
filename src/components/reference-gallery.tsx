"use client";

import Image from "next/image";
import { useState } from "react";
import { contentSources } from "@/features/curriculum/sources";
import type { ReferenceAsset } from "@/types/content";

export function ReferenceGallery({ assets, symbol }: { assets: readonly ReferenceAsset[]; symbol: string }) {
  const [failedIds, setFailedIds] = useState<readonly string[]>([]);
  if (!assets.length) return <p role="status">Contoh referensi belum tersedia untuk huruf ini.</p>;

  return (
    <div className={assets.length === 1 ? "reference-grid reference-single" : "reference-grid"}>
      {assets.map((asset, index) => (
        <figure key={asset.id} className="reference-figure">
          {failedIds.includes(asset.id) ? (
            <div className="reference-unavailable" role="status">Contoh {index + 1} gagal dimuat. Muat ulang halaman untuk mencoba lagi.</div>
          ) : (
            <Image src={asset.url} alt={`Referensi huruf ${symbol}, contoh ${index + 1} dari ${contentSources.find(source => source.id === asset.sourceId)?.publisherOrAuthor ?? "sumber materi"}`} width={asset.width ?? 224} height={asset.height ?? 224} unoptimized
              onError={() => setFailedIds((ids) => [...ids, asset.id])} />
          )}
          <figcaption>Contoh {symbol} · <a href={asset.url} target="_blank" rel="noreferrer">Buka gambar ukuran penuh ↗</a></figcaption>
        </figure>
      ))}
    </div>
  );
}

