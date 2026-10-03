// Private idle container: Coolify executes bounded maintenance commands here.
// Scheduling is external; this process runs no jobs and exposes no listener.
const keepAlive=setInterval(()=>{},3600000);
for(const signal of ['SIGTERM','SIGINT'])process.on(signal,()=>{clearInterval(keepAlive);process.exit(0);});
