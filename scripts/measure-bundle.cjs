const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {gzipSync}=require('node:zlib');
const manifest='.next/server/app/page_client-reference-manifest.js';
const context={};vm.runInNewContext(fs.readFileSync(manifest,'utf8'),context);
const route=Object.values(context.__RSC_MANIFEST)[0];
const files=new Set(JSON.parse(fs.readFileSync('.next/build-manifest.json','utf8')).rootMainFiles);
for(const value of Object.values(route.clientModules))for(const chunk of value.chunks||[]){const file=chunk.includes(':')?chunk.slice(chunk.indexOf(':')+1):chunk;if(file.endsWith('.js')&&fs.existsSync(path.join('.next',file)))files.add(file);}
let raw=0,gzip=0;for(const file of files){const bytes=fs.readFileSync(path.join('.next',file));raw+=bytes.length;gzip+=gzipSync(bytes).length;}
const limit=Number(process.env.DASHBOARD_GZIP_BUDGET||524288);
console.log(JSON.stringify({scope:'dashboard client reference manifest plus root chunks; conservative includes lazy references',files:files.size,raw_bytes:raw,gzip_bytes:gzip,budget_bytes:limit},null,2));
if(gzip>limit)process.exitCode=1;
