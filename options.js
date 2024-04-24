let api_element = document.getElementById('api');
let source_element = document.getElementById('source');
let target_element = document.getElementById('target');

api_element.onchange = event => {
  chrome.storage.sync.set({ api: api_element.value });
};
source_element.onchange = event => {
  chrome.storage.sync.set({ source: source_element.value });
};
target_element.onchange = event => {
  chrome.storage.sync.set({ target: target_element.value });
};

chrome.storage.sync.get(['api', 'source', 'target'], items => {
  api_element.value = items.api;
  source_element.value = items.source;
  target_element.value = items.target;
})
