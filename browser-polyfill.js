//Polyfill browser for chrome. MV3 chrome supports promises
if(typeof browser == "undefined") {
  globalThis.browser = chrome
}