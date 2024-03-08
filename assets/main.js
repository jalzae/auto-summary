function sendRequest() {
  const res = document.getElementById('response')
  const method = document.getElementById('method').value;
  const url = document.getElementById('url').value;
  const params = document.getElementById('params').value;
  const query = document.getElementById('query').value;
  const formEncode = document.getElementById('form-encode').value;
  const form = document.getElementById('form').value;
  const json = document.getElementById('json').value;
  const xml = document.getElementById('xml').value;
  const responseText = document.getElementById('response-text').value;
  const beautifyResponse = document.getElementById('response-beautify').value;
  const responseHtml = document.getElementById('response-html').value;
}

var popover = new bootstrap.Popover(document.getElementById('settingButton'), {
  content: document.getElementById('popover-content').innerHTML,
  boundary: 'viewport',
  html: true
});

function openSettings() {
  popover.show();
}

function saveSettings() {
  popover.hide();
}

function addKeyValuePair(formId) {
  const form = document.getElementById(formId);
  const newPairDiv = createKeyValuePairDiv();
  form.appendChild(newPairDiv);
}

function addFileInput(formId) {
  const form = document.getElementById(formId);
  const newFileDiv = createFileInputDiv();
  form.appendChild(newFileDiv);
}

function removeKeyValuePair(button) {
  const form = button.closest('form');
  form.removeChild(button.parentElement.parentElement);
}

function createKeyValuePairDiv() {
  const newPairDiv =`
  `

  return newPairDiv;
}
