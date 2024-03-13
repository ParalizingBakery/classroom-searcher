//Polyfill browser for chrome. MV3 chrome supports promises
//Run this file/code before using browser namespace.
if(typeof browser == "undefined") {
  globalThis.browser = chrome
}