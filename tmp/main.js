var arn = JSON.parse(getCookie("aws-userInfo"))['arn'];
var navHeader = document.getElementById("consoleNavHeader");
const account = arn.split(':')[4];

let observer = new MutationObserver(mutationRecords => {
    drawDescription();
});

if (navHeader !== null) {
    observer.observe(navHeader, {
        childList: true
    });
}

chrome.runtime.onMessage.addListener(
    function(message, sender, sendResponse) {
        switch (message.type) {
            case "getAccount":
                sendResponse({ number: account });
                break;
            case "drawDescription":
                drawDescription();
                sendResponse({ done: "ok" });
                break;
        }
    }
);

function getCookie(cname) {
    let name = cname + "=";
    let decodedCookie = decodeURIComponent(document.cookie);
    let ca = decodedCookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

function drawDescription() {
    chrome.storage.sync.get(account, (results) => {
        navHeader = document.getElementById("consoleNavHeader");
        header = document.getElementById("aws-description-header");
        span = document.getElementById("aws-description-span");

        datos = results[account];
        if (datos) {
            if (header === null) {
                header = document.createElement('div');
                span = document.createElement('span');

                header.id = "aws-description-header";
                header.className = "globalNav-033";
                header.style.fontFamily = '"Amazon Ember","Helvetica Neue",Roboto,Arial,sans-serif';
                header.style.fontSize = "18px";
                header.style.color = "white";
                header.style.paddingTop = "5px";
                header.style.paddingBottom = "5px";
                header.style.backgroundColor = datos["color"];
                header.appendChild(span);

                span.id = "aws-description-span"
                span.style.marginLeft = "auto";
                span.style.marginRight = "auto";
                span.innerText = "Account: " + datos["description"];

                //document.body.children[0].insertBefore(header, document.body.children[0].firstChild);
                navHeader.children[0].insertBefore(header, navHeader.children[0].firstChild);
            } else {
                header.style.backgroundColor = datos["color"];
                span.innerText = "Account: " + datos["description"];
            }
        }
    });
}
