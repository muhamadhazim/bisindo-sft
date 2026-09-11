import type { ContentSource } from "@/types/content";

// Publisher metadata checked on 2026-09-11. Registering a dataset does not
// verify an individual gesture or choose the teaching reference for the MVP.
export const contentSources: readonly ContentSource[] = [
  {
    id: "raden-asshafi-bisindo-2026-v1",
    title: "BISINDO DATASET",
    publisherOrAuthor: "Arya Raden; MUHAMMAD ASSHAFI",
    url: "https://data.mendeley.com/datasets/4xnkvr88tk/1",
    license: "CC BY 4.0",
    region: null,
    notes:
      "DOI: 10.17632/4xnkvr88tk.1. Published 2026-07-03. Research candidate. " +
      "Publisher describes 26 alphabet labels and seven participants, and cites " +
      "a ministry alphabet reference without identifying its exact edition/link. " +
      "Institution location does not establish a linguistic region. " +
      "Per-sign hand requirements and motion types have not been verified.",
  },
  {
    id: "sanjaya-bisindo-alphabet-2024-v1",
    title: "BISINDO Indonesian Sign Language: Alphabet Image Data",
    publisherOrAuthor: "Samuel Ady Sanjaya",
    url: "https://data.mendeley.com/datasets/ywnjpbcz8m/1",
    license: "CC BY 4.0",
    region: null,
    notes:
      "DOI: 10.17632/ywnjpbcz8m.1. Published 2024-10-18. Secondary research " +
      "candidate with varied participants, devices, and backgrounds. " +
      "Publisher metadata does not specify per-sign hand requirements, motion " +
      "types, or a linguistic region. No teaching content is approved by this entry.",
  },
];
