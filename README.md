# gc-searcher
An extension that lets users search classes in Google Classroom. Searching uses class name and teacher name. Available on home page and archived page.
Searching with teacher name is not supported if the user is a teacher.

Version 4.x 💀 Functionality
- 🔍 Limit search to class name or teacher name
- 🏷️ Set Aliases on classrooms for yourself (Ideas: Initials for quick searching, Rename unhelpful class names)
- [Firefox 🦊] Now able to give permission from extension icon popup

## Get Classroom Searcher
[Chrome Web Store](https://chromewebstore.google.com/detail/classroom-searcher-for-go/jaikfglhnlemaldfnfkmaoigbiohmcna)

[Firefox Addon Store](https://addons.mozilla.org/en-US/firefox/addon/classroom-searcher/)

## How the Google Classroom website works
Google classroom is a single page website. When the user first enters the website, their view is in a `<c-wiz>` element. When the user navigates to a different place, an another `<c-wiz>` is inserted in the body with the old element remaining but invisible. Returning to the old page reuses the c-wiz and search will still be there. There there is a limit to how many new pages you can load before the old one gets removed.

Injecting search when user first enters website will only afffect the first "page". Search will not show up in second page when if user navigates from home to archived and vice versa. Search will not show on any page at all if user starts from a class/to-do/assignment/etc. page. Refreshing will reload document and the current page will become the first (have search).

This extension's approach is to add a [mutationObserver](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver) to look for changes to childList of the `<body>`. A new `<c-wiz>` will trigger the observer, and so will other new/removed elements. It doesn't happen too often (<10 records per page load) so it is acceptable. The callback function will check all lists of classrooms and see whether it already has search.

## About Page Fully Loading
When ~pages~ c-wiz are fully loaded, the `jsdata` attribute of the c-wiz will be incremented to a higher number and will be different depending on order of page load and page type. For example, the home page will first be `deferred-c0` and then change to `deferred-c3` if it is the first page loaded. Later pages might be `deferred-c4` to `deferred-c5` etc.

If you want to use data that is from the page, it is good to set a mutaitionObserver with attributeFilter of jsdata to call a function you want to use.

## Future Improvements
- Modularization
- Separate html from code (fetch())
- Keep track of roomNodes and their commonly used elements in memory instead of using querySeletor() multiple times

Created by Wuttiphat Kiddee
