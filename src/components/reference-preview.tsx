"use client";

import Image from "next/image";
import { useState } from "react";
import { Icon } from "./ui/icon";
import type { ReferenceAsset } from "@/types/content";

export function ReferencePreview({ asset }: { asset: ReferenceAsset }) {
  const [failed,setFailed]=useState(false);
  return <span className="intro-thumbnail">{failed?<Icon name="book" size={30} />:<Image src={asset.url} alt="Contoh alfabet BISINDO dari dataset Rhio Sutoyo" width={160} height={120} unoptimized onError={()=>setFailed(true)} />}</span>;
}
