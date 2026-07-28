# Notepad Tab

A Chrome extension that replaces the new tab page with a persistent notepad, plus a today/tomorrow agenda from your Google Calendar.

## Features

- Every new tab is a centered, distraction-free notepad. The same pad is available from the toolbar popup.
- Free-form canvas: only typing `- ` starts a bullet. Enter continues it, Enter on an empty bullet clears it, Tab and Shift+Tab indent sub-bullets.
- Notes save locally as you type and sync live across tabs and the popup. They survive browser restarts and extension updates.
- Optional calendar sidebar showing today's and tomorrow's events, with the next event highlighted. Works with multiple calendars via their secret iCal URLs, no OAuth needed.
- An eye button in the bottom-left corner blanks the page in every tab, for screen sharing.
- Follows your system appearance: white and blue in light mode, warm charcoal and coral in dark mode.

## Install

1. Download or clone this repo.
2. Open `chrome://extensions`, turn on Developer mode.
3. Click "Load unpacked" and select the repo folder.

Chrome 138+ shows a footer naming the extension on the new tab page. You can right-click it and choose "Hide footer on New Tab page".

## Calendar setup

Click the gear on a new tab and paste one iCal URL per line. In Google Calendar: Settings, pick a calendar, copy "Secret address in iCal format".

Anyone with a secret iCal URL can read that calendar, so don't share your copy of the folder with the URLs saved, and reset the address in Google Calendar if it leaks.

## Development

`preview.html` runs the page outside Chrome's extension sandbox, with `localStorage` standing in for `chrome.storage`. Serve the folder (`python3 -m http.server`) and open it, or open the file directly. The calendar fetch only works in the installed extension because plain pages are blocked by CORS.
