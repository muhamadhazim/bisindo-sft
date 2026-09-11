import { chromium } from '@playwright/test';
import { readFile, writeFile } from 'node:fs/promises';
import ts from 'typescript';
const manifest = JSON.parse(await readFile('ml/rhio/manifest.json','utf8'));
const modules = { '/__train/vision.mjs': 'node_modules/@mediapipe/tasks-vision/vision_bundle.mjs', '/__train/config.mjs': 'src/lib/config/tracking.ts', '/__train/canonicalize.mjs': 'src/lib/mediapipe/canonicalize.ts', '/__train/features.mjs': 'src/features/recognition/features.ts' };
const browser = await chromium.launch({ channel: 'chrome' });
try {
  const page = await browser.newPage();
  await page.route('**/__train/*.mjs', async route => {
    const file=modules[new URL(route.request().url()).pathname]; if(!file)return route.abort();
    let body=await readFile(file,'utf8');
    if(file.endsWith('.ts'))body=ts.transpileModule(body,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText.replaceAll('"@/lib/config/tracking"','"/__train/config.mjs"');
    await route.fulfill({contentType:'text/javascript',body});
  });
  await page.route('**/__dataset/**', async route => {
    const id=decodeURIComponent(new URL(route.request().url()).pathname.slice('/__dataset/'.length));
    if(!manifest.samples.some(s=>s.id===id))return route.abort();
    await route.fulfill({contentType:'image/jpeg',body:await readFile(`.tools/bisindo-dataset/${id}`)});
  });
  await page.goto('http://127.0.0.1:3000/credits');
  await page.exposeFunction('trainingProgress',message=>console.log(message));
  const result = await page.evaluate(async samples => {
    const {FilesetResolver,HandLandmarker}=await import('/__train/vision.mjs');
    const {trackingConfig}=await import('/__train/config.mjs');
    const {canonicalizeHands}=await import('/__train/canonicalize.mjs');
    const {featureSchema,extractFeatures}=await import('/__train/features.mjs');
    const fileset=await FilesetResolver.forVisionTasks(trackingConfig.wasmRoot);
    const rows=[];
    for(const sample of samples){
      const model=await HandLandmarker.createFromOptions(fileset,{baseOptions:{modelAssetPath:trackingConfig.modelPath,delegate:'CPU'},runningMode:'VIDEO',numHands:2,minHandDetectionConfidence:.5,minHandPresenceConfidence:.5,minTrackingConfidence:.5});
      try{
        const image=new Image();image.src='/__dataset/'+encodeURIComponent(sample.id);await image.decode();
        const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;canvas.getContext('2d').drawImage(image,0,0);
        for(let tick=0;tick<3;tick++){
          const timestampMs=1000+tick*100;
          const result=canonicalizeHands(model.detectForVideo(canvas,timestampMs),timestampMs);
          const count=Number(!!result.frame.left)+Number(!!result.frame.right);
          const vector=!result.ambiguous&&count===1?extractFeatures(result.frame):null;
          rows.push({...sample,tick,vector,frame:result.frame,rejection:result.ambiguous?'AMBIGUOUS':count!==1?'HAND_COUNT':vector?null:'INVALID_FEATURES'});
        }
      }finally{model.close();}
      if(rows.length%30===0)await window.trainingProgress(`Extracted ${rows.length/3}/${samples.length} C/L/O images`);
    }
    return {featureSchema,trackingConfig,rows};
  },manifest.samples);
  await writeFile('.tools/bisindo-dataset/features.json',JSON.stringify(result));
  console.log(JSON.stringify({usable:result.rows.filter(r=>r.vector).length,total:result.rows.length}));
}finally{await browser.close();}
