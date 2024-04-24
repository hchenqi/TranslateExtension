function event_stream_tracker() {
  let timeout = null;
  let on_end = null;
  let on_update = null;
  let timeout_object = null;
  let last_event_time = null;
  let on_end_called = false;

  function initialize(v_timeout, v_on_end, v_on_update) {
    timeout = v_timeout;
    on_end = v_on_end;
    on_update = v_on_update;
  }

  function on_event() {
    if (on_end_called) {
      on_update();
    } else {
      if (!timeout_object) {
        function timeout_handler() {
          if (Date.now() - last_event_time >= timeout) {
            on_end();
            on_end_called = true;
            timeout_object = null;
          } else {
            timeout_object = setTimeout(timeout_handler, timeout - (Date.now() - last_event_time));
          }
        }
        timeout_object = setTimeout(timeout_handler, timeout);
      }
      last_event_time = Date.now();
    }
  }

  function clear() {
    clearTimeout(timeout_object);
    timeout_object = null;
    on_end_called = false;
  }

  return {
    initialize,
    on_event,
    clear,
  }
}


async function translate_api(api_key, text, source_lang, target_lang) {
  return { api_key, text, source_lang, target_lang };
  const URL = `https://translation.googleapis.com/language/translate/v2?key=${api_key}&q=${encodeURI(text)}&source=${source_lang}&target=${target_lang}`;
  let res = await fetch(url, { method: 'GET' });
  res = await res.json();
  return res;
}


function pop_up_element(event_stream_tracker_object) {
  let element = document.createElement('div');
  element.style.cssText = `
    display: block;
    z-index: 1024;
    position: fixed;
  `;

  function get_selection() {
    return document.getSelection().toString();
  }

  function is_empty(str) {
    return !str.trim();
  }

  function on_remove() {
    element.remove();
    event_stream_tracker_object.clear();
  }

  element.onclick = event => {
    on_remove();
    event.preventDefault();
  }

  function on_selection() {
    let selection = get_selection();
    if (!is_empty(selection)) {
      element.innerText = " selection: " + selection;
      element.style.left = '0px';
      element.style.top = '0px';
      element.style.color = 'black';
      document.body.appendChild(element);

      if (api_options.api) {
        translate_api(api_options.api, selection, api_options.source, api_options.target).then(res => {
          element.innerText = element.innerText + '\n' + JSON.stringify(res);
        })
      }

    } else {
      on_remove();
    }
  }

  function on_selection_update() {
    //element.innerText = " selection updated: " + get_selection();
    element.style.color = 'red';
  }

  return {
    on_selection,
    on_selection_update
  }
}


const selection_timeout_value = 500;  // 500ms
var event_stream_tracker_object = event_stream_tracker();
var pop_up_element_object = pop_up_element(event_stream_tracker_object);
var api_options = null;

chrome.storage.sync.get(['api', 'source', 'target'], items => api_options = items)

event_stream_tracker_object.initialize(
  selection_timeout_value,
  pop_up_element_object.on_selection,
  pop_up_element_object.on_selection_update
);

document.addEventListener("selectionchange", event_stream_tracker_object.on_event)
