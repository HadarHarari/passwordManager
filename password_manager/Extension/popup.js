/* CONST element id's */
const EMPTY = "";
const USERNAME = "username-val";
const USERNAME_INPUT = "username";
const PASSWORD_INPUT = "user's password"
const PASSWORD = "password-val";
const REQ_LOGIN = "login-request";
const DETAILS_TABLE = "contentTable";
const REGISTER_OPT = "register-option";
const SHOW_DETAILS = "show-details";
const ACCOUNT_DATA_TABLE = "account's-details-table";
const LOGIN_NEXT = "after-login";
const STATUS = "status";
const SIGN_OUT = "sign-out";
const SIGN_IN = "sign-in";
const UNREGISTER = "unregister-account";
const SPECIFIC_SEARCH = "specific-details";
const SPECIFIC_DETAILS = "specific-details-box";
const SPECIFIC_PASSWORD = "specific-details-password";
const SPECIFIC_PASS_BOX = "specific-details-password-box";
const DELETE_FROM_TABLE = "delete-from-details";

var thisBackGroungPage = chrome.extension.getBackgroundPage();
var ifSuccess = 0;

// update tabs 
function updateAllOpenTabs(){
    thisBackGroungPage.chrome.tabs.getAllInWindow(null, function (tabs) {
        for (var i = 0; i < tabs.length; i++) {
            var tab_url = tabs[i].url.split('/');
            tab_url = tab_url[0] + '//' + tab_url[2] + '/';
            if (thisBackGroungPage.user_content[tab_url])
                thisBackGroungPage.chrome.tabs.update(tabs[i].id, {url: tabs[i].url});
        }
        thisBackGroungPage.chrome.runtime.reload();
    });
}

function showAccountsDetails(){
    if (thisBackGroungPage.is_connected){
        document.getElementById(SHOW_DETAILS).innerHTML = "Hide Account's details";
        /* WHEN user click HIDE */
        document.getElementById(SHOW_DETAILS).onclick = function () {
            hideAccountsDetails();
        };
        if (JSON.stringify(thisBackGroungPage.user_content) !== "{}"){
            /* Refresh oldTable if needed */
            if (document.getElementById(DETAILS_TABLE)){
                var oldTable = document.getElementById(DETAILS_TABLE);
                oldTable.parentNode.removeChild(oldTable);
            }
            /* Build HTML Table with users' details */
            var table = document.createElement("TABLE");
            table.setAttribute("id", DETAILS_TABLE);
            document.getElementById(ACCOUNT_DATA_TABLE).appendChild(table);
            for (var url in thisBackGroungPage.user_content){
                for (var form in thisBackGroungPage.user_content[url]){
                    for (var usr in thisBackGroungPage.user_content[url][form]){
                        /* Make Table Row */
                        var tableRow = document.createElement("TR"); 
                        tableRow.setAttribute("id", "contable_" + form + "_" + usr);
                        document.getElementById(DETAILS_TABLE).appendChild(tableRow);
                        /* Make Table Data */
                        var usr_cell = document.createElement("TD");
                        var usr_txt = document.createTextNode("Username: "+usr);
                        usr_cell.appendChild(usr_txt);
                        document.getElementById("contable_" + form + "_" + usr).appendChild(usr_cell);
                        /* Make Table Data */
                        var url_cell = document.createElement("TD"); 
                        var url_txt = document.createTextNode("Web: "+url);
                        url_cell.appendChild(url_txt);
                        document.getElementById("contable_" + form + "_" + usr).appendChild(url_cell);
                       
                    }
                }
            }
        }
        else{ 
            /* There are no details saved by user yet */
            document.getElementById(ACCOUNT_DATA_TABLE).innerHTML = "Sorry, you didn't save any details yet";
        }
    }
}


function handleDeleteFromDetailsTable(url, form, usr){
    if (thisBackGroungPage.confirm("Are you sure you want to Delete " + usr + " details for " + url + "?")){
        var p = thisBackGroungPage.prompt("Please enter passwords' account");
        // thisBackGroungPage.alert("master password from handle delete"+thisBackGroungPage.masterPassword);
        if (p === thisBackGroungPage.masterPassword){
            // thisBackGroungPage.alert("this page delteted"+thisBackGroungPage.user_content[url][form][usr]);
            delete thisBackGroungPage.user_content[url][form][usr];
            if (!thisBackGroungPage.user_content[url][form] || JSON.stringify(thisBackGroungPage.user_content[url][form] === "{}")){
                delete thisBackGroungPage.user_content[url][form];
                if (!thisBackGroungPage.user_content[url] || JSON.stringify(thisBackGroungPage.user_content[url] === "{}")){
                    delete thisBackGroungPage.user_content[url];
                }
            }
            thisBackGroungPage.updateDB();
            thisBackGroungPage.alert("Delete Successed!");
            document.getElementById(ACCOUNT_DATA_TABLE).innerHTML = EMPTY;
            document.getElementById(SHOW_DETAILS).innerHTML = "Show Account's details";
            document.getElementById("delete-specific-details").style.display = 'none';
            document.getElementById(DELETE_FROM_TABLE).innerHTML = "Delete Successed";
            return 1;
        }
        else{
            thisBackGroungPage.alert("Sorry, wrong password, please try later");
            return 0;
        }
    }
}

function hideAccountsDetails(){
    document.getElementById(DELETE_FROM_TABLE).innerHTML = EMPTY;
    if (thisBackGroungPage.is_connected){
        document.getElementById(SHOW_DETAILS).innerHTML = "Show Account's details";
        /* WHEN user click SHOW */
        document.getElementById(SHOW_DETAILS).onclick = function () {
            showAccountsDetails();
        };
        /* Refresh oldTable id needed */
        if (document.getElementById(DETAILS_TABLE)){
            var oldTable = document.getElementById(DETAILS_TABLE);
            oldTable.parentNode.removeChild(oldTable);
        }
        document.getElementById(ACCOUNT_DATA_TABLE).innerHTML = EMPTY;
    }
}
/* Check valid username and password (combined of digits and up/low letters) */
function checkValidUserNameAndPassword(username, password){
    if ((6 <= username.length) && (username.length <= 100) && (/^[A-Za-z0-9]+$/.test(username))){
        if ((password.length === 8) && (/^[A-Za-z0-9]+$/.test(password))){
            return true;
        }
        else {
            document.getElementById(STATUS).innerHTML =
                '<b>Invalid password</b><br>' + '<b>Should combined letters (lower/upper case) and numbers</b><br>';
            return false;
        }
    }
    else {
        document.getElementById(STATUS).innerHTML =
            '<b>Invalid user name</b><br>' + '<b>Should combined letters (lower/upper case) and numbers</b><br>';
        return false;
    }
}




document.addEventListener('DOMContentLoaded', function() {
    /* User Not is_connected */
    if (!thisBackGroungPage.is_connected) {
        document.getElementById(USERNAME).style.display = 'block';
        document.getElementById(PASSWORD).style.display = 'block';
        document.getElementById(REQ_LOGIN).style.display = 'block';
        document.getElementById(SIGN_IN).onclick = function () {
            /* CONCURRENT */
            document.getElementById(SIGN_IN).disabled = true;
            var username = document.getElementById(USERNAME_INPUT).value;
            var password = document.getElementById(PASSWORD_INPUT).value;
            /* Valid username and pass? ---> update BGP and the server too */
            if (checkValidUserNameAndPassword(username, password)) {
                // thisBackGroungPage.alert("KFIRKFIRKFI" + password);
                chrome.runtime.sendMessage({
                    user: username,
                    password: password,
                    request: 'login'
                });
            }
            /* CONCURRENT */
            document.getElementById(SIGN_IN).disabled = false;
        };

        document.getElementById(REGISTER_OPT).onclick = function () {
            /* CONCURRENT */
            document.getElementById(REGISTER_OPT).disabled = true;
            var username = document.getElementById(USERNAME_INPUT).value;
            var password = document.getElementById(PASSWORD_INPUT).value;
            /* Valid username and pass? ---> update BGP and the server too ---> CHECK user Exist */
            if (checkValidUserNameAndPassword(username, password)) {
                chrome.runtime.sendMessage({
                    user: username,
                    password: password,
                    request: 'register'
                });
            }
            /* CONCURRENT */
            document.getElementById(REGISTER_OPT).disabled = false;
        };
    }
    /* User is_connected */
    else { 
        document.getElementById(LOGIN_NEXT).style.display = 'block';
        document.getElementById(STATUS).innerHTML = "Nice to see you again " + thisBackGroungPage.user +" :)";
        document.getElementById(SPECIFIC_SEARCH).onclick = function() {
        var txt;
        var foundOne = 0;
        var password;
        var Murl;
        var Musr;
        var Mform;
        var link = prompt("Please enter full address:", "https://www.facebook.com/");
        if (link === null || link === EMPTY) {
            txt = "User cancelled the prompt";
        } else {
            for (var url in thisBackGroungPage.user_content){
                for (var form in thisBackGroungPage.user_content[url]){
                    for (var usr in thisBackGroungPage.user_content[url][form]){
                        if(link === url){
                            password = thisBackGroungPage.user_content[url][form][usr] + "\n";
                            txt = "Username: " + usr + "\nLink: " + url + "\n";
                            Murl=url;
                            Musr=usr;
                            Mform=form;
                            foundOne = 1;
                    }
                }
            }
        }
            if(foundOne === 0)
                txt = "There is no inforamtion about this site";
        }
        document.getElementById(SPECIFIC_DETAILS).innerHTML = txt;
        if(foundOne === 1){
            document.getElementById(SPECIFIC_PASSWORD).onclick = function () {
                if(confirm('Are you sure you want expose your password?')){
                    var p = thisBackGroungPage.prompt("Please enter password for account");
                    if(p === thisBackGroungPage.masterPassword)
                        document.getElementById(SPECIFIC_PASS_BOX).innerHTML = password;
                    else
                        thisBackGroungPage.alert("Incorret password, Please try again later");
                    }
                else
                document.getElementById(SPECIFIC_PASS_BOX).innerHTML = "User chosed NO";
                }
            document.getElementById(SPECIFIC_PASSWORD).style.display = 'block';
            document.getElementById("delete-specific-details").style.display = 'block';
            document.getElementById("delete-specific-details").onclick = function(){
                ifSuccess = handleDeleteFromDetailsTable(Murl,Mform,Musr);
                if(ifSuccess === 1){
                    document.getElementById(SPECIFIC_PASSWORD).style.display = 'none';
                    document.getElementById(SPECIFIC_DETAILS).innerHTML = EMPTY;
                    document.getElementById(SPECIFIC_PASS_BOX).innerHTML = EMPTY;
                }
                else{
                    document.getElementById(SPECIFIC_PASSWORD).onclick = function () {
                        if(confirm('Are you sure you want expose your password?')){
                            var p = thisBackGroungPage.prompt("Please enter password for account");
                            if(p === thisBackGroungPage.masterPassword)
                                document.getElementById(SPECIFIC_PASS_BOX).innerHTML = password;
                            else
                                thisBackGroungPage.alert("Incorret password, Please try again later");
                            }
                        else
                        document.getElementById(SPECIFIC_PASS_BOX).innerHTML = "User chosed NO";
                        }
                }
            }
            }
        }
        document.getElementById(SHOW_DETAILS).onclick = function () {
            showAccountsDetails();
        };
        document.getElementById(SIGN_OUT).onclick = function() {
            if (thisBackGroungPage.is_connected) {
                /* User become UNCONNECTED! */
                thisBackGroungPage.is_connected = false;
               
                thisBackGroungPage.socket.emit("sign_out", {user: thisBackGroungPage.user});
                /* Update all tabs - using getAllInWindow() chromes' function */
                updateAllOpenTabs();
            }
        };
        document.getElementById(UNREGISTER).onclick = function(){
            if (thisBackGroungPage.is_connected){
                thisBackGroungPage.is_connected = false;
                if (thisBackGroungPage.confirm("Are you sure you want to delete your account?")){
                    var p = thisBackGroungPage.prompt("Please Enter your passwords' account");
                    if (p !== null){
                        /* User Should write his MASTER password */
                        // thisBackGroungPage.alert("P"+ p+" masterPassword:"+thisBackGroungPage.masterPassword)
                        // console.log("P"+ p+" masterPassword:"+thisBackGroungPage.masterPassword);

                        if (p === thisBackGroungPage.masterPassword){
                                thisBackGroungPage.socket.emit('unregister', {user: thisBackGroungPage.user, password: thisBackGroungPage.passwordForServer});
                                thisBackGroungPage.respone = "user deleted";
                                /* Update all tabs - using getAllInWindow() chromes' function */
                                updateAllOpenTabs();
                                thisBackGroungPage.alert("Account has been deleted");
                        }
                        /* WRONG password */
                        else{
                            thisBackGroungPage.alert("Sorry, wrong password, please try later");
                        }
                    }
                    /* User wrote nothing || cancelled it */
                    else { 
                        thisBackGroungPage.console.log("Account wasn't deleted");
                    }
                } /* User cancelled it */
                else{
                    thisBackGroungPage.console.log("Account wasn't deleted");
                    thisBackGroungPage.is_connected = true;
                }
            }
        };
    }
});
