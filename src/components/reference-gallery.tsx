"use client";

import Image from "next/image";
import { useState } from "react";
import type { ReferenceAsset } from "@/types/content";

export function ReferenceGallery({ assets, symbol }: { assets: readonly ReferenceAsset[]; symbol: string }) {
  const [failedIds, setFailedIds] = useState<readonly string[]>([]);
  if (!assets.length) return <p role="status">Contoh referensi belum tersedia untuk huruf ini.</p>;

  return (
    <div className="reference-grid">
      {assets.map((asset, index) => (
        <figure key={asset.id} className="reference-figure">
          {failedIds.includes(asset.id) ? (
            <div className="reference-unavailable" role="status">Contoh {index + 1} gagal dimuat. Gunakan contoh lain atau muat ulang halaman.</div>
          ) : (
            <Image src={asset.url} alt={`Referensi huruf ${symbol}, contoh ${index + 1} dari dataset Sanjaya`} width={224} height={224} unoptimized
              onError={() => setFailedIds((ids) => [...ids, asset.id])} />
          )}
          <figcaption>Contoh {index + 1} · {symbol}</figcaption>
        </figure>
      ))}
    </div>
  );
}
