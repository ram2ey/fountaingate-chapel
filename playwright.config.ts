import { defineConfig, devices } from '@playwright/test';
const external=process.env.PLAYWRIGHT_BASE_URL;
export default defineConfig({
 testDir:'./tests/browser',fullyParallel:false,workers:1,retries:0,
 use:{baseURL:external||'http://127.0.0.1:3100',trace:'retain-on-failure'},
 projects:[{name:'desktop',use:{...devices['Desktop Chrome']}},{name:'mobile',use:{...devices['iPhone 13'],defaultBrowserType:'chromium'}}],
 webServer:external?undefined:{command:'node scripts/browser-server.cjs',url:'http://127.0.0.1:3100/login',reuseExistingServer:false,timeout:120000,env:{HOSTNAME:'127.0.0.1',PORT:'3100',DATABASE_URL:'',AUTH_DATABASE_URL:'',MNOTIFY_API_KEY:'',SMS_BROADCAST_ENABLED:'false',PAYMENTS_ENABLED:'false',HUBTEL_CONTRACT_CONFIRMED:'false'}},
});
