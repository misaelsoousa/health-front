
export default {
  bootstrap: () => import('./main.server.mjs').then(m => m.default),
  inlineCriticalCss: true,
  baseHref: '/health-front/',
  locale: undefined,
  routes: [
  {
    "renderMode": 2,
    "route": "/health-front"
  },
  {
    "renderMode": 2,
    "route": "/health-front/dashboard"
  },
  {
    "renderMode": 2,
    "route": "/health-front/patients"
  },
  {
    "renderMode": 2,
    "route": "/health-front/exams"
  }
],
  entryPointToBrowserMapping: undefined,
  assets: {
    'index.csr.html': {size: 12328, hash: '2f28aee94413f45d491a2140a94156211bb4d5b75f3a940dee9a0072a201ab08', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 1013, hash: 'af63661d9007b8adcdcbce3d500c78e74067525cff148ca0d8567092e1f8741c', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'index.html': {size: 291, hash: 'b39d55db075962de1121247e0d144326bc029723c1784cb716faa35be031b859', text: () => import('./assets-chunks/index_html.mjs').then(m => m.default)},
    'dashboard/index.html': {size: 47478, hash: '8c2e0d59a0257a1d1088cf91a46adef55f982416ef2afe353d3eddf9f401a6dc', text: () => import('./assets-chunks/dashboard_index_html.mjs').then(m => m.default)},
    'exams/index.html': {size: 45834, hash: 'e3e1bd682f63a739d45bd971a619dcdfe64e967db67238f4d4b9c908f01b50e6', text: () => import('./assets-chunks/exams_index_html.mjs').then(m => m.default)},
    'patients/index.html': {size: 43940, hash: 'b256a46914dec24459d5d5e5a9d6807f521a9672533ef968632a59845cdc51a9', text: () => import('./assets-chunks/patients_index_html.mjs').then(m => m.default)},
    'styles-EEDT4RJW.css': {size: 37729, hash: '8PPLxqHqL8Q', text: () => import('./assets-chunks/styles-EEDT4RJW_css.mjs').then(m => m.default)}
  },
};
