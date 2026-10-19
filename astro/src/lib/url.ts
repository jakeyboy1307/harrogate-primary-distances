// Page links that work at the site root and under the GitHub Pages sub-path
export const url = (p = '') => import.meta.env.BASE_URL.replace(/\/?$/, '/') + p.replace(/^\//, '');
