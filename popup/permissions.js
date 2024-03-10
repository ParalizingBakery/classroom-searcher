function main() {
    initHostButton()
}

function initHostButton () {
    //Initial variables
    const PERMISSION_BUTTON_ID = "permission-button"
    const button = document.getElementById(PERMISSION_BUTTON_ID)
    if (!button) {
        throw new Error(`Element with ID ${PERMISSION_BUTTON_ID} not found`)
    }
    const required = {
        origins:["https://classroom.google.com/*"]
    }
    let haveRequired = false

    //Let the user know if they have perms
    button.addEventListener("click", async () => {
        if (await browser.permissions.contains(required)) {
            button.innerHTML = "Already Have Permissions"
            haveRequired = true
            return
        }
    })

    //Requesting permissions requires a User action handler.
    //They aren't allowed to be async, even if the function needs await to get a return value 
    button.addEventListener("click", () => {
        if (haveRequired) {return}
        browser.permissions.request(required)
    })
}

main()
