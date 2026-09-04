# Notepad Tab

A Chrome extension that turns the new tab page into a notepad, with an optional agenda from your Google Calendar beside it.

## Features

- The new tab page is a centered pad. The toolbar popup holds the same pad.
- Nothing formats itself. Typing `- ` starts a bullet, Enter continues it, Enter on an empty bullet ends it, Tab and Shift+Tab move it in and out.
- Notes save as you type, reach open tabs within moments, and survive restarts and updates.
- An optional sidebar lists today's and tomorrow's events and highlights the next one, read from the calendars' secret iCal addresses.
- The eye button blanks the pad across open tabs, for screen sharing.
- Follows your system appearance, in black, white and orange.

## Install

1. Clone or download this repo.
2. Open `chrome://extensions` and turn on Developer mode.
3. Click "Load unpacked" and select the folder.

Chrome 138 and later shows a footer naming the extension on the new tab page. Right-click it and choose "Hide footer on New Tab page".

## Calendar setup

Click the gear on a new tab and paste one iCal address per line. In Google Calendar, open Settings, pick a calendar, and copy its "Secret address in iCal format".

That address is a key to the calendar, so keep the folder to yourself once addresses are saved, and reset the address in Google Calendar if one gets out.

## Development

`preview.html` runs the page outside the extension sandbox, with `localStorage` standing in for `chrome.storage`. Serve the folder with `python3 -m http.server`. The calendar fetch works only in the installed extension, since CORS blocks it from a plain page.
