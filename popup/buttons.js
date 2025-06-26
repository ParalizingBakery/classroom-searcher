if(typeof browser == "undefined") {
  globalThis.browser = chrome
}

selectorDiv = document.querySelector("div.sel-inputs")
selectorShow = document.querySelector("button.sel-show")

selectorShow.addEventListener("click", () => {
    if (selectorDiv.style.display === "none") {
        selectorDiv.style.display = "block"
        selectorShow.textContent = "Hide"
    } else {
        selectorDiv.style.display = "none"
        selectorShow.textContent = "Show"
    }
})

let selClass = selectorDiv.querySelector(".sel-class")
let selTeacher = selectorDiv.querySelector(".sel-teacher")
let selRoomList = selectorDiv.querySelector(".sel-roomlist")
let selRoomNode = selectorDiv.querySelector(".sel-node")
let selHeader = selectorDiv.querySelector(".sel-header")


/**
 * @param {HTMLInputElement} input
 */
function inputFactory(id) {
    return (event) => {
        newSel = event.target.value
        if (newSel.trim() == "") {
            browser.storage.sync.remove(id)
        } else {
            browser.storage.sync.set({[id]: newSel})
        }
    }
}

async function setUserSelectors () {
    const result = await browser.storage.sync.get([
        "sel-class",
        "sel-teacher",
        "sel-roomlist",
        "sel-node",
        "sel-header"
    ]);

    if (result["sel-class"] !== undefined) {
        selClass.value = result["sel-class"];
    }
    if (result["sel-teacher"] !== undefined) {
        selTeacher.value = result["sel-teacher"];
    }
    if (result["sel-roomlist"] !== undefined) {
        selRoomList.value = result["sel-roomlist"];
    }
    if (result["sel-node"] !== undefined) {
        selRoomNode.value = result["sel-node"];
    }
    if (result["sel-header"] !== undefined) {
        selHeader.value = result["sel-header"];
    }
}

setUserSelectors()

selClass.addEventListener("change", inputFactory("sel-class"))
selTeacher.addEventListener("change", inputFactory("sel-teacher"))
selRoomList.addEventListener("change", inputFactory("sel-roomlist"))
selRoomNode.addEventListener("change", inputFactory("sel-node"))
selHeader.addEventListener("change", inputFactory("sel-header"))

const roomNodeHeaderSelector = "div.Tc9hUd"

