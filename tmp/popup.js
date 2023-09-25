const addbutton = document.getElementById('add-account');

$(document).ready(function() {
    $("#alert-message").hide();
    $("#alert-message-main").hide();
    $("#predefined-colors").hide();
    $("#dev_color").click(function() {
        console.log("click")
        $("#input_color").val("#348a34");
    });
    $("#test_color").click(function() {
        console.log("click")
        $("#input_color").val("#f39820");
    });
    $("#prod_color").click(function() {
        console.log("click")
        $("#input_color").val("#ea0606");
    });

    $("#use-predefined-colors").change(function() {
        if ($(this).prop("checked")) {
            $("#predefined-colors").show();
        } else {
            $("#predefined-colors").hide();
        }
    });

    $("input:radio[name='colors']").click(function() {
        if ($(this).prop("id") == "dev-option") {
            $("#input_color").val("#348a34");
        } else if ($(this).prop("id") == "test-option") {
            $("#input_color").val("#f39820");
        } else if ($(this).prop("id") == "prod-option") {
            $("#input_color").val("#ea0606");
        }
        return true;
    });

    $("#get-account").click(function() {
        chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
            aws_console_regex = new RegExp("(.*?)\.console\.aws\.amazon\.com(.*)");
            if (aws_console_regex.test(tabs[0].url)) {
                chrome.tabs.sendMessage(tabs[0].id, { type: "getAccount" }, function(response) {
                    $("#input_account").val(response.number);
                });
            } else {
                $("#alert-message").text("Current tab is not an AWS Console. Please select a tab that matches 'https://*.console.aws.amazon.com/*'");
                $("#alert-message").fadeTo(2000, 500).slideUp(500, function() {
                    $("#alert-message").slideUp(1000);
                });
            }
        });
    });

    var toastElList = [].slice.call(document.querySelectorAll('.toast'))
    var toastList = toastElList.map(function(toastEl) {
        return new bootstrap.Toast(toastEl)
    })

    $('#myTab button').on('click', function(e) {
        e.preventDefault()
        $(this).tab('show');

        chrome.runtime.sendMessage({ type: "GetSSOAccounts" }, (response) => {
            if (response) {
                $("#import-sso-accounts").prop('disabled', false);
                $("#import-sso-count").text(response.length);
            } else {
                $("#import-sso-accounts").prop('disabled', true);
                $("#import-sso-count").text("");
            }
        });

    })
});

document.querySelectorAll('input').forEach(input => {
    if (window.browser !== undefined) {
        // On Firefox
        // Workaround for a bug in their color picker
        input.type = "text";
    }
});

function delete_account(o) {
    console.log(o);

    var p = o.srcElement.parentNode.parentNode;
    p.parentNode.removeChild(p);

    console.log("remove id:" + p.id);
    chrome.storage.sync.remove(p.id);
}

function change_color(o) {
    var p = o.srcElement.parentNode.parentNode;
    console.log("change id:" + p.id + " to :" +
        o.srcElement.value);

    chrome.storage.sync.get(p.id, (results) => {

        datos = results[p.id];
        datos["color"] = o.srcElement.value;
        console.log(datos);
        chrome.storage.sync.set({
            [p.id]: datos
        });

        $("#toast-main-message").toast("show");
        $("#toast-main-message-text").text("Color for account " + p.id + " was succesfully changed.")

        redraw_content();
    });
}

function change_description(o) {

    var p = o.srcElement.parentNode.parentNode;
    console.log("change id:" + p.id + " to :" +
        o.srcElement.value);

    chrome.storage.sync.get(p.id, (results) => {

        datos = results[p.id];
        datos["description"] = o.srcElement.value;
        console.log(datos);

        chrome.storage.sync.set({
            [p.id]: datos
        });

        $("#toast-main-message").toast("show");
        $("#toast-main-message-text").text("Description for account " + p.id + " was succesfully changed.")

        redraw_content();
    });
}
let addedRows = 0;

function AddRowToTable(AccountId, AccountName) {
    return new Promise((resolve, reject) => {
        let rowAdded = false
        chrome.storage.sync.get(AccountId, (results) => {
            if (!results[AccountId]) {
                color = "#348a34";
                if (AccountName.includes("dev")) {
                    color = "#348a34";
                } else if (AccountName.includes("test")) {
                    color = "#f39820";
                } else if (AccountName.includes("prod")) {
                    color = "#ea0606";
                }

                AddRow(AccountId, AccountName, color);
                rowAdded = true;
            }
            resolve(rowAdded);
        });

        return true;
    });
}

$('#import-sso-accounts').click(function() {
    chrome.runtime.sendMessage({ type: "GetSSOAccounts" }, (response) => {
        console.log("Get Saved SSO data");
        console.log(response);
        addedRows = 0;
        response.forEach(element => {
            var rowAdded = AddRowToTable(element.AccountId, element.AccountName).then(rowAdded => {
                if (rowAdded) {
                    addedRows++;
                    $("#toast-message-import-text").text("Added " + addedRows + " new accounts.")
                }
            });
        });

        if (addedRows == 0) {
            $("#toast-message-import-text").text("No new accounts found");
        }

        $("#toast-message-import").toast("show");


    });
});

$('#save-region').click(function() {
    chrome.storage.local.set({'aws_region': $('#aws_region').val()});
});

function AddRow(account, description, color) {


    record = { "description": description, "color": color };

    console.log("record:" + record);
    chrome.storage.sync.set({
        [account]: record
    });

    $("#input_description").val("");
    $("#input_account").val("");

    $("#toast-message").toast("show");
    $("#toast-message-text").text("Account " + account + " was succesfully added.")


    var table = document.getElementById('aws_accounts');
    var rowCount = table.rows.length;
    var row = table.insertRow(rowCount);

    row.id = account

    cell = row.insertCell(0);
    cell.style.width = "22%"
    const input_account = document.createElement("input");
    input_account.type = "text"
    input_account.value = account;
    input_account.readOnly = true;
    input_account.className = "form-control";
    cell.appendChild(input_account);

    cell = row.insertCell(1);
    const input_description = document.createElement("input");
    input_description.type = "text"
    input_description.value = description;
    input_description.className = "form-control"
    input_description.addEventListener("change", change_description)
    cell.appendChild(input_description);

    cell = row.insertCell(2);
    const input_color = document.createElement("input");
    input_color.type = "color"
    input_color.value = color
    input_color.className = "form-control form-control-color"
    input_color.addEventListener("change", change_color)
    cell.appendChild(input_color);

    cell = row.insertCell(3);
    const remove_button = document.createElement("button");
    remove_button.className = "button";
    remove_button.innerText = "remove"
    remove_button.className = "btn btn-primary";
    remove_button.addEventListener("click", delete_account)
    cell.appendChild(remove_button);

    redraw_content();

}

$('#add-account').click(function() {
    const account = $('#input_account').val();
    const description = $('#input_description').val();
    const color = $('#input_color').val();

    if (account == "" || account.length != 12) {
        $("#input_account").addClass("is-invalid");
        $("#account-invalid-feedback").text("Please enter a valid Account number.");
        return;
    } else {
        $("#input_account").removeClass("is-invalid");
    }

    if (description == "") {
        $("#input_description").addClass("is-invalid");
        return;
    } else {
        $("#input_description").removeClass("is-invalid");
    }

    chrome.storage.sync.get(account, (results) => {
        if (results[account]) {
            $("#account-invalid-feedback").text("Account already exists.");
            $("#input_account").addClass("is-invalid");
            return false;
        } else {
            AddRow(account, description, color);
        }
    });


});

function redraw_content() {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        aws_console_regex = new RegExp("(.*?)\.console\.aws\.amazon\.com(.*)");
        if (aws_console_regex.test(tabs[0].url)) {
            chrome.tabs.sendMessage(tabs[0].id, { type: "drawDescription" }, function(response) {
                //Nothing
            });
        }
    });
}

function loadFromStorage() {

    chrome.storage.local.get(['aws_region'], response => {
        $("#aws_region").val(response.aws_region || 'eu-central-1')
    });

    chrome.storage.sync.get(null, function(items) {
        var allKeys = Object.keys(items);
        console.log(allKeys);
    });

    chrome.storage.sync.get(null, data => {
        if (data) {
            console.log(data)
            var table = document.getElementById('aws_accounts');
            var rowCount = 1;

            for (const [id, value] of Object.entries(data)) {

                var row = table.insertRow(rowCount);
                row.id = id

                rowCount++;

                cell = row.insertCell(0);
                cell.style.width = "22%"
                const input_account = document.createElement("input");
                input_account.type = "text"
                input_account.value = id;
                input_account.readOnly = true;
                input_account.className = "form-control";
                cell.appendChild(input_account);

                cell = row.insertCell(1);
                const input_description = document.createElement("input");
                input_description.type = "text"
                input_description.value = value["description"];
                input_description.className = "form-control";
                input_description.addEventListener("change", change_description)
                cell.appendChild(input_description);

                cell = row.insertCell(2);
                cell.style.width = "80px";
                const input_color = document.createElement("input");
                input_color.type = "color"
                input_color.value = value["color"];
                input_color.className = "form-control form-control-color";
                input_color.addEventListener("change", change_color)
                cell.appendChild(input_color);

                cell = row.insertCell(3);
                const remove_button = document.createElement("button");
                remove_button.className = "button";
                remove_button.innerText = "remove";
                remove_button.className = "btn btn-primary";
                remove_button.addEventListener("click", delete_account)
                cell.appendChild(remove_button);

            }
        }
    });
}

loadFromStorage();
