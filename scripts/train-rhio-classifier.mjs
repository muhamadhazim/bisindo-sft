import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {RandomForestClassifier} from 'ml-random-forest';
import {loadTrainingContract} from './load-training-contract.mjs';
const read=async p=>JSON.parse(await readFile(p,'utf8'));
const dataset=await read('.tools/bisindo-dataset/features.json');
const manifest=await read('ml/rhio/manifest.json');
const {validateTrainingData,featureSchema,extractFeatures}=await loadTrainingContract();
validateTrainingData(manifest,dataset,featureSchema,extractFeatures);
const labels=['C','L','O'];
const usable=dataset.rows.filter(r=>r.vector);
const train=usable.filter(r=>r.split==='train');const validation=usable.filter(r=>r.split==='validation');const test=usable.filter(r=>r.split==='test');
for(const label of labels)if(!train.some(r=>r.label===label)||!validation.some(r=>r.label===label))throw new Error(`Missing train/validation coverage: ${label}`);
const options={seed:42,nEstimators:80,maxFeatures:.65,replacement:false,useSampleBagging:true,noOOB:true,treeOptions:{maxDepth:12,minNumSamples:2}};
const forest=new RandomForestClassifier(options);forest.train(train.map(r=>r.vector),train.map(r=>labels.indexOf(r.label)));
const votes=v=>{const counts=[0,0,0];for(const c of forest.predictionValues([v]).getRow(0))counts[c]++;return counts.map(c=>c/options.nEstimators);};
const ranked=v=>votes(v).map((score,index)=>({score,index})).sort((a,b)=>b.score-a.score);
let calibration;
for(const threshold of [.5,.55,.6,.65,.7,.75,.8,.85,.9]){
  let correct=0,wrong=0;for(const r of validation){const rank=ranked(r.vector);if(rank[0].score>=threshold&&rank[0].score>rank[1].score){if(labels[rank[0].index]===r.label)correct++;else wrong++;}}
  const item={threshold,correct,wrong,total:validation.length};
  if(!calibration||wrong<calibration.wrong||wrong===calibration.wrong&&correct>=Math.ceil(validation.length*.8))calibration=item;
}
const distance=(a,b)=>Math.sqrt(a.reduce((sum,v,i)=>sum+(v-b[i])**2,0)/a.length);
const sameMask=(a,b)=>a[50]===b[50]&&a[51]===b[51];
const envelopes=labels.map(label=>{
  const positives=train.filter(r=>r.label===label);
  const distances=[...positives,...validation.filter(r=>r.label===label)].map(r=>Math.min(...positives.filter(p=>p.groupId!==r.groupId&&sameMask(p.vector,r.vector)).map(p=>distance(p.vector,r.vector)))).filter(Number.isFinite).sort((a,b)=>a-b);
  if(!distances.length)throw new Error(`No distance coverage ${label}`);
  return {label,maxDistance:distances[Math.ceil(distances.length*.95)-1],vectors:positives.map(r=>r.vector)};
});
const classify=v=>{const rank=ranked(v);const label=labels[rank[0].index];const envelope=envelopes.find(e=>e.label===label);const nearest=Math.min(...envelope.vectors.filter(p=>sameMask(p,v)).map(p=>distance(p,v)));return rank[0].score>=calibration.threshold&&rank[0].score>rank[1].score&&nearest<=envelope.maxDistance?label:null;};
const confusion=labels.map(()=>[0,0,0,0]);for(const r of test){const predicted=classify(r.vector);confusion[labels.indexOf(r.label)][predicted?labels.indexOf(predicted):3]++;}
const payload={id:'rhio-clo-rf-v1',version:'1.0.0',status:'EXPERIMENTAL',labels,featureSchema:dataset.featureSchema,runtime:{name:'ml-random-forest',version:'2.1.0'},landmarker:dataset.trackingConfig,source:{id:'rhio-bisindo-2024',repo:manifest.repo,revision:manifest.revision,license:'MIT'},threshold:calibration.threshold,envelopes,forest:forest.toJSON()};
await mkdir('public/models/rhio-clo-v1',{recursive:true});
const modelText=JSON.stringify(payload);await writeFile('public/models/rhio-clo-v1/model.json',modelText);
const report={modelSha256:createHash('sha256').update(modelText).digest('hex'),options,sourceImages:manifest.samples.length,usableImages:new Set(usable.map(r=>r.id)).size,counts:{train:train.length,validation:validation.length,test:test.length,rejected:dataset.rows.length-usable.length},calibration,testConfusion:{rows:labels,columns:[...labels,'UNCERTAIN'],values:confusion},limitations:['Three frames per source image are correlated, not independent samples.','Parent-image groups only; signer/session independence unknown.','No real-user or unknown-pose accuracy claim.'],golden:labels.flatMap(label=>test.filter(r=>r.label===label).slice(0,2)).map(r=>({id:r.id,frame:r.frame,vector:r.vector,votes:votes(r.vector),predicted:classify(r.vector)}))};
await writeFile('ml/rhio/evaluation.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({...report,golden:undefined},null,2));


