const arn = JSON.parse(getCookie('aws-userInfo'))['arn'];
let navHeader = document.getElementById('consoleNavHeader');
const account = arn.split(':')[4];

let observer = new MutationObserver((_mutationRecords) => {
    drawDescription();
});

if (navHeader !== null) {
    observer.observe(navHeader, {
        childList: true
    });
}

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    switch (message.type) {
        case 'getAccount':
            sendResponse({
                number: account
            });
            break;
        case 'drawDescription':
            drawDescription();
            sendResponse({
                done: 'ok'
            });
            break;
    }
});

function interpolate(template, data) {
    return template.replace(/{{(.*?)}}/g, (match, p1) => data[p1]);
}

function getCookie(cname) {
    let name = cname + '=';
    let decodedCookie = decodeURIComponent(document.cookie);
    let ca = decodedCookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) === 0) {
            return c.substring(name.length, c.length);
        }
    }
    return '';
}

function drawDescription() {
    let header_format = 'Account: {{account}} - {{description}}';
    let header_align = 'left';
    let header_size = 18;
    chrome.storage.local.get(['header_settings'], (response) => {
        let settings = response.header_settings || {};
        if (settings) {
            header_format =
                settings.format || 'Account: {{account}} - {{description}}';
            header_align = settings.align || 'left';
            header_size = settings.size || 18;

            let header_bit_pattern = settings.alignment || 1;
            for (let i = 0; i < 8; i++) {
                switch (header_bit_pattern & (1 << i)) {
                    case 1:
                        header_align = 'left';
                        break;
                    case 2:
                        header_align = 'center';
                        break;
                    case 4:
                        header_align = 'right';
                        break;
                    default:
                        break;
                }
            }
        }
    });

    chrome.storage.sync.get(account, (results) => {
        let navHeader = document.getElementById('consoleNavHeader');
        let header = document.getElementById('aws-description-header');
        let span = document.getElementById('aws-description-span');

        let datos = results[account];
        if (datos) {
            let header_text = interpolate(header_format, {
                account: account,
                description: datos['description']
            });

            if (header === null) {
                header = document.createElement('div');
                span = document.createElement('span');
                header.appendChild(span);
                if (navHeader) {
                    navHeader.children[0].insertBefore(
                        header,
                        navHeader.children[0].firstChild
                    );
                }
            }

            header.id = 'aws-description-header';
            header.className = 'globalNav-033';
            header.style.fontFamily =
                '"Amazon Ember","Helvetica Neue",Roboto,Arial,sans-serif';
            header.style.fontSize = `${header_size}px`;
            header.style.color = datos['foreground'];
            header.style.paddingTop = '5px';
            header.style.paddingBottom = '5px';
            header.style.backgroundColor = datos['color'];
            header.style.textAlign = header_align;

            span.id = 'aws-description-span';
            span.style.marginLeft = 'auto';
            span.style.marginRight = 'auto';
            span.innerText = header_text;
        }
    });
}
