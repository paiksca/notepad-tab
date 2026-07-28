const ta = document.getElementById('pad');
let saveTimer = null;

function flushSave() {
  if (saveTimer === null) return;
  clearTimeout(saveTimer);
  saveTimer = null;
  chrome.storage.local.set({ notes: ta.value });
}

chrome.storage.local.get({ notes: '' }, (r) => {
  ta.value = r.notes;
  ta.focus();
  ta.setSelectionRange(ta.value.length, ta.value.length);
});

ta.addEventListener('input', () => {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(flushSave, 250);
});
window.addEventListener('blur', flushSave);
window.addEventListener('pagehide', flushSave);
document.addEventListener('visibilitychange', flushSave);

// live-sync edits made in other tabs or the popup
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local' || !changes.notes) return;
  const v = changes.notes.newValue ?? '';
  if (v === ta.value || saveTimer !== null) return; // our own pending edits win
  const { selectionStart, selectionEnd, scrollTop } = ta;
  ta.value = v;
  ta.setSelectionRange(Math.min(selectionStart, v.length), Math.min(selectionEnd, v.length));
  ta.scrollTop = scrollTop;
});

function lineStart(pos) {
  return ta.value.lastIndexOf('\n', pos - 1) + 1;
}

// execCommand keeps the textarea's native undo stack working
function insert(text) {
  document.execCommand('insertText', false, text);
}
function removeSelection() {
  document.execCommand('delete', false);
}

ta.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey && !e.metaKey && !e.ctrlKey && !e.altKey) {
    const pos = ta.selectionStart;
    const line = ta.value.slice(lineStart(pos), pos);
    const m = line.match(/^(\s*)- (.*)$/);
    if (!m) return;
    e.preventDefault();
    if (m[2] === '' && ta.selectionEnd === pos) {
      // enter on an empty bullet clears it
      ta.setSelectionRange(lineStart(pos), pos);
      removeSelection();
    } else {
      insert('\n' + m[1] + '- ');
    }
  } else if (e.key === 'Tab') {
    e.preventDefault();
    const pos = ta.selectionStart;
    const end = ta.selectionEnd;
    const ls = lineStart(pos);
    if (e.shiftKey) {
      const lead = ta.value.slice(ls, ls + 2);
      const n = lead === '  ' ? 2 : lead.startsWith(' ') ? 1 : 0;
      if (!n) return;
      ta.setSelectionRange(ls, ls + n);
      removeSelection();
      ta.setSelectionRange(Math.max(ls, pos - n), Math.max(ls, end - n));
    } else {
      ta.setSelectionRange(ls, ls);
      insert('  ');
      ta.setSelectionRange(pos + 2, end + 2);
    }
  }
});
