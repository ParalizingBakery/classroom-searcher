if(typeof browser == "undefined") {
  globalThis.browser = chrome
}

browser.runtime.onInstalled.addListener(async (details)=>{
    if (details.reason === "update") {
        url = browser.runtime.getURL("popup/update.html")
    }
    await browser.tabs.create({ url });
})