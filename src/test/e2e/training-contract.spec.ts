import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { validateTrainingData } from "../../../ml/rhio/training-contract";
import { extractFeatures, featureSchema } from "../../features/recognition/features";
import { CloClassifier, type CloModel } from "../../features/recognition/clo-classifier";
import { signContents } from "../../features/curriculum/content";
import type { HandFrame } from "../../types/tracking";
import manifest from "../../../ml/rhio/manifest.json";
const report = JSON.parse(readFileSync("ml/rhio/evaluation.json", "utf8")) as { golden: Array<{ id: string; frame: HandFrame; vector: number[] }> };
function fixture() {
  const samples = manifest.samples.filter(s=>report.golden.some(r=>r.id===s.id));
  return { manifest: {samples}, dataset: {featureSchema,rows:report.golden.map((row,tick)=>({...samples.find(s=>s.id===row.id)!,...row,tick}))} };
}

test("training input is bound to source labels, original groups and publisher test partitions", () => {
  const input=fixture();
  expect(()=>validateTrainingData(input.manifest,input.dataset,featureSchema,extractFeatures)).not.toThrow();
  for (const changed of ["split","label","groupId"] as const) {
    const altered=structuredClone(input);altered.dataset.rows[0]![changed]="changed";
    expect(()=>validateTrainingData(altered.manifest,altered.dataset,featureSchema,extractFeatures)).toThrow(/provenance/);
  }
  const leaked=structuredClone(input);
  const sibling={...leaked.manifest.samples[0]!,id:"duplicate-parent",publisherSplit:"train",split:"train"};
  leaked.manifest.samples.push(sibling);
  expect(()=>validateTrainingData(leaked.manifest,leaked.dataset,featureSchema,extractFeatures)).toThrow(/crosses partitions/);
});

test("stale schema, altered features and duplicate extraction ticks fail before fitting", () => {
  const input=fixture();
  const stale={...featureSchema,id:"different-schema"};
  expect(()=>validateTrainingData(input.manifest,{...input.dataset,featureSchema:stale},featureSchema,extractFeatures)).toThrow(/schema/);
  const altered=structuredClone(input);altered.dataset.rows[0]!.vector[25]!+=0.01;
  expect(()=>validateTrainingData(altered.manifest,altered.dataset,featureSchema,extractFeatures)).toThrow(/parity/);
  const duplicate=structuredClone(input);duplicate.dataset.rows.push(duplicate.dataset.rows[0]!);
  expect(()=>validateTrainingData(duplicate.manifest,duplicate.dataset,featureSchema,extractFeatures)).toThrow(/Duplicate/);
});

test("trained recognition requires release when target changes and emits acceptance once", () => {
  const engine=new CloClassifier(JSON.parse(readFileSync("public/models/rhio-clo-v1/model.json","utf8")) as CloModel);
  const c=signContents.find(s=>s.symbol==="C")!;const l=signContents.find(s=>s.symbol==="L")!;
  const cFrame=report.golden.find(r=>r.id.startsWith("test/C."))!.frame;
  const lFrame=report.golden.find(r=>r.id.startsWith("test/L."))!.frame;
  const evaluate=(frame:HandFrame,timestampMs:number,target= c)=>engine.evaluate({frame:{...frame,timestampMs},ambiguous:false},target);
  for (const t of [0,100,200,300]) expect(evaluate(cFrame,t).accepted).toBe(false);
  expect(evaluate(cFrame,400).accepted).toBe(true);
  expect(evaluate(cFrame,500).accepted).toBe(false);
  expect(evaluate(lFrame,600,l).waitingRelease).toBe(true);
  expect(evaluate(lFrame,700,l).accepted).toBe(false);
  for(const t of [800,900,1000,1100])evaluate({timestampMs:t,left:null,right:null},t,l);
  for(const t of [1200,1300,1400,1500])expect(evaluate(lFrame,t,l).accepted).toBe(false);
  expect(evaluate(lFrame,1600,l).accepted).toBe(true);
});

test("current-pose feedback changes after acceptance without requiring release or awarding again", () => {
  const engine=new CloClassifier(JSON.parse(readFileSync("public/models/rhio-clo-v1/model.json","utf8")) as CloModel);
  const target=signContents.find(s=>s.symbol==="C")!;
  const c=report.golden.find(r=>r.id.startsWith("test/C."))!.frame;
  const l=report.golden.find(r=>r.id.startsWith("test/L."))!.frame;
  const evaluate=(frame:HandFrame,t:number,ambiguous=false)=>engine.evaluate({frame:{...frame,timestampMs:t},ambiguous},target);
  for(const t of [0,100,200,300])evaluate(c,t);
  expect(evaluate(c,400)).toMatchObject({status:"CORRECT",accepted:true});
  expect(evaluate(l,500)).toMatchObject({status:"RETRY",predictedLetter:"L",accepted:false,waitingRelease:true});
  expect(evaluate(c,600)).toMatchObject({status:"TRACKING",accepted:false});
  for(const t of [700,800,900])evaluate(c,t);
  expect(evaluate(c,1000)).toMatchObject({status:"CORRECT",accepted:false,waitingRelease:true});
  expect(evaluate(c,1100,true)).toMatchObject({status:"UNCERTAIN",predictedLetter:null,accepted:false});
  expect(evaluate(c,1200)).toMatchObject({status:"TRACKING",accepted:false});
  expect(evaluate(c,1200)).toMatchObject({status:"UNCERTAIN",accepted:false});
  expect(evaluate(c,1600)).toMatchObject({status:"TRACKING",accepted:false});
  expect(evaluate({timestampMs:1700,left:null,right:null},1700)).toMatchObject({status:"NO_HAND",accepted:false});
});
