# Notepad Tab

A Chrome extension that turns every new tab into a notepad, with an optional agenda from your Google Calendar beside it.

## Features

- Every new tab opens a centered pad with nothing else on it. The same pad is in the toolbar popup, so a note is one click away from any page.
- Text stays plain until you ask for a list. Typing `- ` starts a bullet, Enter continues it, Enter on an empty bullet ends it, and Tab and Shift+Tab move a bullet in and out.
- Notes save locally as you type and appear in every other tab and in the popup within moments. They survive browser restarts and extension updates.
- An optional sidebar lists today's and tomorrow's events and highlights the next one. Calendars are read from their secret iCal addresses, so setup is a paste rather than a sign-in, and several calendars can feed the same list.
- The eye button in the bottom-left corner blanks the pad in every tab at once, for when you are sharing your screen.
- Follows your system appearance: black on white in light mode, warm off-white on near-black in dark mode, with an orange accent in both.

## Install

1. Download or clone this repo.
2. Open `chrome://extensions` and turn on Developer mode.
3. Click "Load unpacked" and select the repo folder.

Chrome 138 and later shows a footer naming the extension on the new tab page. Right-click it and choose "Hide footer on New Tab page" to put it away.

## Calendar setup

Click the gear on a new tab and paste one iCal address per line. In Google Calendar, open Settings, pick a calendar, and copy its "Secret address in iCal format".

That address is a key to the calendar: anyone holding it can read every event. Keep your copy of the folder to yourself once the addresses are saved, and reset the address in Google Calendar if one gets out.

## Development

`preview.html` runs the page outside Chrome's extension sandbox, with `localStorage` standing in for `chrome.storage`. Serve the folder with `python3 -m http.server` and open it, or open the file directly. The calendar fetch works only in the installed extension, since CORS blocks it from a plain page.
