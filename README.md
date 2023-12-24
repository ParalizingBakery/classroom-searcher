# gc-searcher
An extension that lets users search classes in Google Classroom. Searching uses class name and teacher name. Available on home page and archived page.

Searching with teacher name is not supported if the user is a teacher.

## How the Google Classroom website works
The most frustrating part of developing the extension is making sure the search loads on the home page and the archive page. This is because Google classroom is a single page website. When the user first enters the website, their view is in a `<c-wiz>` element. When the user navigates to a different place, an another `<c-wiz>` is inserted in the body with the old element remaining but invisible. Returning to the old page reuses the c-wiz and search will still be there. There there is a limit to how many new pages you can load before the old one gets removed.

Injecting search when user first enters website will only afffect the first "page". Search will not show up in second page when if user navigates from home to archived and vice versa. Search will not show on any page at all if user starts from a class/to-do/assignment/etc. page. Refreshing will reload document and the current page will become the first (have search).

This extension's approach is to add a [mutationObserver](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver) to look for changes to childList of the `<body>`. A new `<c-wiz>` will trigger the observer, and so will other new/removed elements. It doesn't happen too often (<10 records per page load) so it is acceptable. The callback function will check all lists of classrooms and see whether it already has search.

Created by Wuttiphat Kiddee
