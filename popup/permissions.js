let button = document.getElementById("permission-button")

if (button === null) {
    throw new Error("element #permission-button not found")
}

const required = {
    origins:["https://classroom.google.com/*"]
}

let haveRequired = false

button.addEventListener('click', () => {
    if (haveRequired) {return}
    browser.permissions.request(required)
})

button.addEventListener("click", async () => {
    if (await browser.permissions.contains(required)) {
        button.innerHTML = "Already Have Permissions"
        haveRequired = true
        return
    }
})
