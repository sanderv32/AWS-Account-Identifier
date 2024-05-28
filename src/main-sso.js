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

chrome.runtime.sendMessage(
    {
        type: 'GetAwsRegion'
    },
    (_aws_region) => {
        // const region = aws_region || 'eu-central-1';
        // const region = document.querySelector('meta[name="region"]').content || 'eu-central-1';
        const region = JSON.parse(
            document.querySelector('script[id="env"]').text
        ).region;
        const xhttp = new XMLHttpRequest();
        xhttp.open(
            'GET',
            'https://portal.sso.' +
                region +
                '.amazonaws.com/instance/appinstances'
        );
        xhttp.responseType = 'json';
        xhttp.setRequestHeader(
            'x-amz-sso-bearer-token',
            getCookie('x-amz-sso_authn')
        );
        xhttp.setRequestHeader(
            'x-amz-sso_bearer_token',
            getCookie('x-amz-sso_authn')
        );
        xhttp.send();

        xhttp.onload = function () {
            console.log(this.response);

            let len = this.response.result.length;

            let newData = [];

            for (let i = 0; i < len; i += 1) {
                if (this.response.result[i].applicationName === 'AWS Account') {
                    let obj = {};
                    obj.AccountId =
                        this.response.result[i].searchMetadata.AccountId;
                    obj.AccountName =
                        this.response.result[i].searchMetadata.AccountName;
                    newData.push(obj);
                }
            }

            chrome.runtime.sendMessage(
                {
                    type: 'SetSSOAccounts',
                    data: JSON.parse(JSON.stringify(newData))
                },
                (_response) => {
                    console.log(
                        'Saved SSO data to LocalStorage for Console augmentation.'
                    );
                }
            );
        };
    }
);
