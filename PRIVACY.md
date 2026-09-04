# Privacy policy for Notepad Tab

Last updated 4 September 2026.

## What the extension stores

Notepad Tab keeps two things, both in `chrome.storage.local` on your own computer:

- The text of your notes.
- The iCal addresses you paste into the calendar settings, if you use the agenda.

Neither is sent anywhere. There is no account, no server behind the extension, and no analytics or tracking of any kind.

## What the extension fetches

If you add one or more iCal addresses, the extension requests those calendar feeds directly from Google so it can list today's and tomorrow's events. Those requests go from your browser to `calendar.google.com` and nowhere else, and the events are read into the page rather than stored.

If you add no addresses, the extension makes no network requests at all.

## Permissions and why they exist

- `storage` keeps your notes and calendar settings on the device, so they survive closing a tab, restarting Chrome, and updating the extension.
- Access to `https://calendar.google.com/*` allows the fetch described above. It covers only that one host.

## Sharing

Nothing is shared, sold, or transferred to anyone, because nothing leaves your computer in the first place.

## Removing your data

Uninstalling the extension removes everything it stored. Clearing the calendar settings and saving removes the iCal addresses on their own.

## Contact

Questions about this policy belong in the issue tracker:
https://github.com/paiksca/notepad-tab/issues
