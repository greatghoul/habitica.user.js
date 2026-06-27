// ==UserScript==
// @name         Habitica - Upload Image
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Paste to upload image then insert into text box in habitica.
// @author       greatghoul
// @match        https://habitica.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=habitica.com
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// @connect      habitica-imgur.vercel.app
// ==/UserScript==
(function() {
  'use strict';

  const API_URL = 'https://habitica-imgur.vercel.app/upload';
  var isUploading = false;

  function log(message, level) {
    if (level === undefined) level = 'info';
    var prefix = '[Habitica - Upload Image]';
    if (level === 'error') {
      console.error(prefix, message);
    } else if (level === 'warn') {
      console.warn(prefix, message);
    } else {
      console.log(prefix, message);
    }
  }

  var fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = 'image/jpeg,image/jpg,image/png,image/gif';
  fileInput.style.display = 'none';
  fileInput.addEventListener('change', function() {
    if (fileInput.files.length > 0) {
      var blob = fileInput.files[0];
      fileInput.value = '';
      doUpload(blob);
    }
  });
  document.body.appendChild(fileInput);

  var SVG_ICON = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>';
  var SVG_SPINNER = '<svg class="hc-spin" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10" stroke-dasharray="50" stroke-dashoffset="50"/></svg>';

  GM_addStyle(`
    @keyframes hc-spin {
      to { transform: rotate(360deg); }
    }
    .hc-spin { animation: hc-spin 1s linear infinite; }
    .hc-upload-btn:hover { background: #e5e5e5; }
    .hc-upload-toolbar {
      display: flex;
      width: 100%;
      border: 1px solid #ddd;
      border-bottom: none;
      border-radius: 4px 4px 0 0;
      background: #fafafa;
    }
    .hc-upload-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      padding: 0;
      border: none;
      border-radius: 4px;
      background: none;
      cursor: pointer;
      color: #555;
    }
  `);

  function updateButtons() {
    document.querySelectorAll('.hc-upload-btn').forEach(function(btn) {
      btn.disabled = isUploading;
      btn.style.pointerEvents = isUploading ? 'none' : '';
      btn.innerHTML = isUploading ? SVG_SPINNER : SVG_ICON;
      btn.title = isUploading ? 'Uploading...' : 'Upload Image';
    });
  }

  function insertImage(textField, imageUrl) {
    var cursorPosition = textField.selectionStart;
    var textBeforeCursorPosition = textField.value.substring(0, cursorPosition);
    var textAfterCursorPosition = textField.value.substring(cursorPosition, textField.value.length);
    textField.value = textBeforeCursorPosition + "![](" + imageUrl + ")" + textAfterCursorPosition;
    textField.dispatchEvent(new Event('input', { bubbles: true }));
    textField.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function doUpload(blob) {
    var textField = getChatTexarea();
    if (!textField) {
      log('textarea not found, abort upload', 'warn');
      return;
    }
    log('Start uploading image, size: ' + blob.size + ' bytes');
    isUploading = true;
    updateButtons();
    var data = new FormData();
    data.append('image', blob);

    GM_xmlhttpRequest({
      method: 'POST',
      url: API_URL,
      data: data,
      onload: function(response) {
        log('Upload response status: ' + response.status);
        log('Response body: ' + response.responseText);
        try {
          var result = JSON.parse(response.responseText);
          var imageUrl = result.data ? result.data.link : result.link || result.url;
          log('Image uploaded successfully: ' + imageUrl);
          insertImage(textField, imageUrl);
        } catch (e) {
          log('Failed to parse response JSON: ' + e, 'error');
        }
        isUploading = false;
        updateButtons();
      },
      onerror: function(error) {
        log('Upload request failed', 'error');
        console.error(error);
        isUploading = false;
        updateButtons();
      }
    });
  }

  function handlePaste(textField, event) {
    var items = (event.clipboardData || event.originalEvent.clipboardData).items;
    for (let index in items) {
      var item = items[index];
      if (item.kind === 'file') {
        event.preventDefault();
        log('Paste detected, uploading image');
        doUpload(item.getAsFile());
      }
    }
  }

  function injectToolbar(textarea) {
    if (textarea.dataset.hcUploadReady) return;
    textarea.dataset.hcUploadReady = '1';

    var toolbar = document.createElement('div');
    toolbar.className = 'hc-upload-toolbar';

    var btn = document.createElement('button');
    btn.className = 'hc-upload-btn';
    btn.type = 'button';
    btn.title = 'Upload Image';
    btn.innerHTML = SVG_ICON;
    btn.addEventListener('click', function() {
      log('Button clicked, opening file picker');
      textarea.classList.add('hc-upload-textarea');
      fileInput.click();
    });

    toolbar.appendChild(btn);
    textarea.parentNode.insertBefore(toolbar, textarea);

    log('Toolbar injected above textarea');
  }

  document.addEventListener("paste", function(event) {
    if (isUploading) {
      event.preventDefault();
      return;
    }
    var element = event.target;
    if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
      handlePaste(element, event);
    }
  });

  function getChatTexarea() {
    return document.querySelector('.chat-row textarea');
  }

  function render() {
    const textarea = getChatTexarea();
    if (!textarea) return;

    injectToolbar(textarea);
  }

  var observer = new MutationObserver(render);
  observer.observe(document.body, { childList: true, subtree: true });
  render();
})();
