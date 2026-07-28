// Hide/show toggle for screen sharing. The veiled flag is shared storage, so
// one click hides the pad in every open tab, the popup, and future new tabs.
const hideBtn = document.getElementById('hidebtn');
const padEl = document.getElementById('pad');

function applyVeil(v) {
  document.body.classList.toggle('veiled', v);
  hideBtn.title = v ? 'Show notes' : 'Hide notes';
  padEl.disabled = v;
  if (v) padEl.blur();
}

chrome.storage.local.get({ veiled: false }, (r) => applyVeil(r.veiled));

hideBtn.addEventListener('click', () => {
  const v = !document.body.classList.contains('veiled');
  chrome.storage.local.set({ veiled: v });
  applyVeil(v);
  if (!v) padEl.focus();
});

chrome.storage.onChanged.addListener((ch, area) => {
  if (area === 'local' && ch.veiled) applyVeil(!!ch.veiled.newValue);
});
