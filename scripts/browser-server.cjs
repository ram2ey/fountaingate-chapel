// Run the built standalone application with its real static assets for local E2E.
const fs=require('node:fs/promises');
const path=require('node:path');
async function main(){
 await fs.cp(path.resolve('.next/static'),path.resolve('.next/standalone/.next/static'),{recursive:true});
 await fs.cp(path.resolve('public'),path.resolve('.next/standalone/public'),{recursive:true});
 require(path.resolve('.next/standalone/server.js'));
}
main().catch(()=>{console.error('Build the standalone application before browser tests.');process.exitCode=1;});
