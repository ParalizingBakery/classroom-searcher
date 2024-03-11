const checkboxContainerClass = "checkbox-container"

function main() {
    initHostButton()
    initCheckboxes()
}

function initCheckboxes() {
    //Match id with perm to request
    const permList = {
        "request-storage-checkbox": {
            permissions: ["storage"]
        }
    }
    //Select all checkboxes
    let checkboxNodes = document.querySelectorAll(`.${checkboxContainerClass} > input`)

    checkboxNodes.forEach( async (element) => {
        const perm = permList[element.id]
        let havePerm = await browser.permissions.contains(perm)
        
        //Check if contains permission
        if (havePerm) {
            element.checked = true
        }
        //Add event listeners
        element.addEventListener("change", (event) => handlePermCheckbox(event, perm))
    })
}
/**
 * 
 * @param {Event} event 
 * @param {browser.permissions.Permissions} permission 
 */
function handlePermCheckbox (event, permission) {
    /** @type {HTMLInputElement} */
    let checkbox = event.target

    if (checkbox.checked) {
        browser.permissions.request(permission)
            .then((approved) => {
                let status = ""
                if (approved) {
                    status = "Request Successful"
                } else {
                    status = "Request Failed"
                }
                checkbox.labels.forEach((label) => {
                    label.innerText = label.innerText + ` : ${status}`
                })
            })
    }
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
            .then((approved) => {
                if (approved) {
                    button.innerHTML = "Request Successful"
                } else {
                    button.innerHTML = "Request Failed"
                }
            })
    })
}

main()
