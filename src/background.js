function getAllStorageSyncData() {
    // Immediately return a promise and start asynchronous work
    return new Promise((resolve, reject) => {
        // Asynchronously fetch all data from storage.sync.
        chrome.storage.local.get(['ssoaccounts'], ({ ssoaccounts }) => {
            // Pass any observed errors down the promise chain.
            if (chrome.runtime.lastError) {
                return reject(chrome.runtime.lastError);
            }
            // Pass the data retrieved from storage down the promise chain.
            resolve(ssoaccounts);
        });
    });
}

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    switch (message.type) {
        case 'SetSSOAccounts':
            console.log(
                'background SetAccount ' + JSON.stringify(message.data)
            );
            chrome.storage.local
                .set({ ssoaccounts: message.data })
                .then(() => {});
            sendResponse('OK');
            break;
        case 'GetSSOAccounts':
            getAllStorageSyncData().then((ssoaccounts) => {
                let my_items = ssoaccounts;
                sendResponse(my_items);
            });
            return true;
        case 'GetAwsRegion':
            chrome.storage.local.get(['aws_region'], (response) => {
                sendResponse(response.aws_region);
            });
            return true;
    }
});
