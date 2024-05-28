$(() => {
    $('#alert-message').hide();
    $('#alert-message-main').hide();
    $('#predefined-colors').hide();
    $('#dev_color').on('click', function () {
        console.log('click');
        $('#input_color').val('#348a34');
    });
    $('#test_color').on('click', function () {
        console.log('click');
        $('#input_color').val('#f39820');
    });
    $('#prod_color').on('click', function () {
        console.log('click');
        $('#input_color').val('#ea0606');
    });

    $('#use-predefined-colors').on('change', function () {
        if ($(this).prop('checked')) {
            $('#predefined-colors').show();
        } else {
            $('#predefined-colors').hide();
        }
    });

    $("input:radio[name='colors']").on('click', function () {
        if ($(this).prop('id') === 'dev-option') {
            $('#input_color').val('#348a34');
        } else if ($(this).prop('id') === 'test-option') {
            $('#input_color').val('#f39820');
        } else if ($(this).prop('id') === 'prod-option') {
            $('#input_color').val('#ea0606');
        }
        return true;
    });

    $('#get-account').on('click', function () {
        chrome.tabs.query(
            {
                active: true,
                currentWindow: true
            },
            function (tabs) {
                let aws_console_regex = new RegExp(
                    '(.*?).console.aws.amazon.com(.*)'
                );
                if (aws_console_regex.test(tabs[0].url)) {
                    chrome.tabs.sendMessage(
                        tabs[0].id,
                        {
                            type: 'getAccount'
                        },
                        function (response) {
                            $('#input_account').val(response.number);
                        }
                    );
                } else {
                    $('#alert-message')
                        .text(
                            "Current tab is not an AWS Console. Please select a tab that matches 'https://*.console.aws.amazon.com/*'"
                        )
                        .fadeTo(2000, 500)
                        .slideUp(500, function () {
                            $('#alert-message').slideUp(1000);
                        });
                }
            }
        );
    });

    const toastElList = [].slice.call(document.querySelectorAll('.toast'));
    const _toastList = toastElList.map(function (toastEl) {
        return new bootstrap.Toast(toastEl); /* eslint no-undef: 0 */
    });

    $('#myTab button').on('click', function (e) {
        e.preventDefault();
        $(this).tab('show');

        chrome.runtime.sendMessage(
            {
                type: 'GetSSOAccounts'
            },
            (response) => {
                if (response) {
                    $('#import-sso-accounts').prop('disabled', false);
                    $('#import-sso-count').text(response.length);
                } else {
                    $('#import-sso-accounts').prop('disabled', true);
                    $('#import-sso-count').text('');
                }
            }
        );
    });
});

document.querySelectorAll('input').forEach((input) => {
    if (window.browser !== undefined) {
        // On Firefox
        // Workaround for a bug in their color picker
        input.type = 'text';
    }
});

function delete_account(o) {
    console.log(o);

    const p = o.target.parentNode.parentNode;
    p.parentNode.removeChild(p);

    console.log('remove id:' + p.id);
    chrome.storage.sync.remove(p.id).then(() => {});
}

function change_color(o) {
    const p = o.target;
    console.log('change id:' + p.id + ' to :' + o.target.value);
    p.style.background = p.value;

    chrome.storage.sync.get(p.id, (results) => {
        let datos = results[p.id];
        if (o.target.hasAttribute('foreground')) {
            datos.foreground = o.target.value;
        } else {
            datos.color = o.target.value;
        }
        console.log(datos);
        chrome.storage.sync
            .set({
                [p.id]: datos
            })
            .then(() => {});

        const color_type = o.target.hasAttribute('foreground')
            ? 'Foreground'
            : 'Background';
        $('#toast-main-message').toast('show');
        $('#toast-main-message-text').text(
            color_type +
                ' color for account ' +
                p.id +
                ' was succesfully changed.'
        );

        redraw_content();
    });
}

function change_description(o) {
    const p = o.target.parentNode.parentNode;
    console.log('change id:' + p.id + ' to :' + o.target.value);

    chrome.storage.sync.get(p.id, (results) => {
        let datos = results[p.id];
        datos['description'] = o.target.value;
        console.log(datos);

        chrome.storage.sync
            .set({
                [p.id]: datos
            })
            .then(() => {});

        $('#toast-main-message').toast('show');
        $('#toast-main-message-text').text(
            'Description for account ' + p.id + ' was successfully changed.'
        );

        redraw_content();
    });
}
let addedRows = 0;

function AddRowToTable(AccountId, AccountName) {
    return new Promise((resolve, _reject) => {
        let rowAdded = false;
        chrome.storage.sync.get(AccountId, (results) => {
            if (!results[AccountId]) {
                let color = '#348a34';
                if (AccountName.includes('dev')) {
                    color = '#348a34';
                } else if (AccountName.includes('test')) {
                    color = '#f39820';
                } else if (AccountName.includes('prod')) {
                    color = '#ea0606';
                }

                AddRow(AccountId, AccountName, color);
                rowAdded = true;
            }
            resolve(rowAdded);
        });

        return true;
    });
}

$('#import-sso-accounts').on('click', function () {
    chrome.runtime.sendMessage(
        {
            type: 'GetSSOAccounts'
        },
        (response) => {
            console.log('Get Saved SSO data');
            console.log(response);
            addedRows = 0;
            response.forEach((element) => {
                const _rowAdded = AddRowToTable(
                    element.AccountId,
                    element.AccountName
                ).then((rowAdded) => {
                    if (rowAdded) {
                        addedRows++;
                        $('#toast-message-import-text').text(
                            'Added ' + addedRows + ' new accounts.'
                        );
                    }
                });
            });

            if (addedRows === 0) {
                $('#toast-message-import-text').text('No new accounts found');
            }

            $('#toast-message-import').toast('show');
        }
    );
});

$('#save-region').on('click', function () {
    chrome.storage.local
        .set({
            aws_region: $('#aws_region').val()
        })
        .then(() => {});
});

function AddRow(account, description, color) {
    let record = {
        description: description,
        color: color
    };

    console.log('record:' + record);
    chrome.storage.sync
        .set({
            [account]: record
        })
        .then(() => {});

    $('#input_description').val('');
    $('#input_account').val('');

    $('#toast-message').toast('show');
    $('#toast-message-text').text(
        'Account ' + account + ' was succesfully added.'
    );

    const table = document.getElementById('aws_accounts');
    const rowCount = table.rows.length;
    const row = table.insertRow(rowCount);

    row.id = account;

    let cell = row.insertCell(0);
    cell.style.width = '22%';
    const input_account = document.createElement('input');
    input_account.type = 'text';
    input_account.value = account;
    input_account.readOnly = true;
    input_account.className = 'form-control';
    cell.appendChild(input_account);

    cell = row.insertCell(1);
    const input_description = document.createElement('input');
    input_description.type = 'text';
    input_description.value = description;
    input_description.className = 'form-control';
    input_description.addEventListener('change', change_description);
    cell.appendChild(input_description);

    cell = row.insertCell(2);
    const input_color = document.createElement('input');
    input_color.type = 'color';
    input_color.value = color;
    input_color.className = 'form-control form-control-color';
    input_color.addEventListener('change', change_color);
    cell.appendChild(input_color);

    cell = row.insertCell(3);
    const remove_button = document.createElement('button');
    remove_button.className = 'button';
    remove_button.innerText = 'remove';
    remove_button.className = 'btn btn-primary';
    remove_button.addEventListener('click', delete_account);
    cell.appendChild(remove_button);

    redraw_content();
}

$('#add-account').on('click', function () {
    const account = $('#input_account').val();
    const description = $('#input_description').val();
    const color = $('#input_color').val();

    if (account === '' || account.length !== 12) {
        $('#input_account').addClass('is-invalid');
        $('#account-invalid-feedback').text(
            'Please enter a valid Account number.'
        );
        return;
    } else {
        $('#input_account').removeClass('is-invalid');
    }

    if (description === '') {
        $('#input_description').addClass('is-invalid');
        return;
    } else {
        $('#input_description').removeClass('is-invalid');
    }

    chrome.storage.sync.get(account, (results) => {
        if (results[account]) {
            $('#account-invalid-feedback').text('Account already exists.');
            $('#input_account').addClass('is-invalid');
            return false;
        } else {
            AddRow(account, description, color);
        }
    });
});

$('#header-settings-tab').on('hide.bs.tab', store_settings_tab);
$('#header-left').on('change', store_settings_tab);
$('#header-right').on('change', store_settings_tab);
$('#header-center').on('change', store_settings_tab);
$('#header-text-size').on('change', store_settings_tab);
$('#header-format').on('change', store_settings_tab);

function store_settings_tab() {
    let header_bit_pattern = 0;
    $('input[name="header-position"').each(function (index) {
        header_bit_pattern += $(this).prop('checked') ? 1 << index : 0;
    });

    chrome.storage.local
        .set({
            header_settings: {
                alignment: header_bit_pattern,
                size: $('#header-text-size').val(),
                format: $('#header-format').val()
            }
        })
        .then(() => {
            redraw_content();
        });
}

function redraw_content() {
    chrome.tabs.query(
        {
            active: true,
            currentWindow: true
        },
        function (tabs) {
            let aws_console_regex = new RegExp(
                '(.*?).console.aws.amazon.com(.*)'
            );
            if (aws_console_regex.test(tabs[0].url)) {
                chrome.tabs.sendMessage(
                    tabs[0].id,
                    {
                        type: 'drawDescription'
                    },
                    function (_response) {
                        //Nothing
                    }
                );
            }
        }
    );
}

function color_picker() {
    chrome.storage.sync.get(null, (data) => {
        if (data) {
            for (const [id, value] of Object.entries(data)) {
                Coloris.setInstance(`picker-${id}`, {
                    defaultColor: value['color'],
                    inline: true
                });
            }
        }
    });
}

function diagonal_div(cpickerId, foregroundColor, backgroundColor) {
    const diagonal_div = document.createElement('div');
    const first_half_overlay = document.createElement('div');
    const second_half_overlay = document.createElement('div');
    const first_half_span = document.createElement('span');
    const second_half_span = document.createElement('span');
    diagonal_div.className = 'diagonal-div';
    first_half_overlay.className = 'overlay first-half';
    second_half_overlay.className = 'overlay second-half';
    first_half_overlay.value = foregroundColor;
    second_half_overlay.value = backgroundColor;
    first_half_overlay.setAttribute('data-coloris', '');
    second_half_overlay.setAttribute('data-coloris', '');
    first_half_overlay.setAttribute('foreground', '');
    second_half_overlay.setAttribute('background', '');
    first_half_overlay.style.background = foregroundColor;
    second_half_overlay.style.background = backgroundColor;
    first_half_overlay.addEventListener('change', change_color);
    second_half_overlay.addEventListener('change', change_color);
    first_half_overlay.id = cpickerId;
    second_half_overlay.id = cpickerId;
    first_half_span.className = 'overlay-text';
    second_half_span.className = 'overlay-text';
    diagonal_div.appendChild(first_half_overlay);
    diagonal_div.appendChild(second_half_overlay);
    first_half_overlay.appendChild(first_half_span);
    second_half_overlay.appendChild(second_half_span);
    first_half_span.innerHTML = 'F';
    second_half_span.innerHTML = 'B';
    return diagonal_div;
}

function loadFromStorage() {
    chrome.storage.local.get(['aws_region'], (response) => {
        $('#aws_region').val(response.aws_region || 'eu-central-1');
    });

    chrome.storage.local.get(['header_settings'], (response) => {
        let settings = response.header_settings || {};
        if (settings) {
            let header_format =
                settings.format || 'Account: {{account}} - {{description}}';
            $('#header-format').val(header_format);

            let header_size = settings.size || 18;
            $('#header-text-size').val(header_size);

            let header_bit_pattern = settings.alignment || 1;
            for (let i = 0; i < 8; i++) {
                switch (header_bit_pattern & (1 << i)) {
                    case 1:
                        $('#header-left').prop('checked', true);
                        break;
                    case 2:
                        $('#header-center').prop('checked', true);
                        break;
                    case 4:
                        $('#header-right').prop('checked', true);
                        break;
                    default:
                        break;
                }
            }
        }
    });

    chrome.storage.sync.get(null, function (items) {
        const allKeys = Object.keys(items);
        console.log(allKeys);
    });

    chrome.storage.sync.get(null, (data) => {
        if (data) {
            console.log(data);
            const table = document.getElementById('aws_accounts');
            let rowCount = 1;

            for (const [id, value] of Object.entries(data)) {
                const row = table.insertRow(rowCount);
                row.id = id;

                rowCount++;

                let cell = row.insertCell(0);
                cell.style.width = '22%';
                const input_account = document.createElement('input');
                input_account.type = 'text';
                input_account.value = id;
                input_account.readOnly = true;
                input_account.className = 'form-control';
                cell.appendChild(input_account);

                cell = row.insertCell(1);
                const input_description = document.createElement('input');
                input_description.type = 'text';
                input_description.value = value['description'];
                input_description.className = 'form-control';
                input_description.addEventListener(
                    'change',
                    change_description
                );
                cell.appendChild(input_description);

                cell = row.insertCell(2);
                cell.style.verticalAlign = 'middle';
                cell.style.width = '80px';
                const div_color = diagonal_div(
                    id,
                    value['foreground'] || '#FFF',
                    value['color']
                );
                div_color.id = `cpicker-${id}`;
                div_color.style.width = '80px';
                div_color.style.height = '30px';
                cell.appendChild(div_color);

                cell = row.insertCell(3);
                const remove_button = document.createElement('button');
                remove_button.className = 'button';
                remove_button.innerText = 'remove';
                remove_button.className = 'btn btn-primary';
                remove_button.addEventListener('click', delete_account);
                cell.appendChild(remove_button);
            }
        }
    });
}

loadFromStorage();
color_picker();
