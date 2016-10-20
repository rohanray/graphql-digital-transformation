import fetch from 'node-fetch';

import { WP_API_URL } from '../constants.js';

function fetchWordPressPageByURL (relativeURL) {
  console.log(`fetchWordPressPageByURL: ${WP_API_URL}${relativeURL}`);
  return fetch(`${WP_API_URL}${relativeURL}`).then(res => res.json());
}

export { fetchWordPressPageByURL };
