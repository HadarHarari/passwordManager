
/* -------- CREDIT to w3schools.com ----------- */

/* Const querySelector / Elements */

var user_content;
/* Bring users' webs details */
chrome.storage.local.get(['user_content'], function(items){
    user_content = items.user_content;
});

/* Get pages' URL */
var url = document.URL.split("/");
url = url[0] + "//" + url[2] + "/";
var pagesPasswords = document.querySelectorAll("input[type=password]");
/* Case 1: found password bullets in page */
if (Object.keys(pagesPasswords).length !== 0){
    var Ancestors = [];
    for (var i = 0; i < Object.keys(pagesPasswords).length; i++) {
        Ancestors[i] = FindAncestorForForm(pagesPasswords[i]);
    }

    for (var i = 0; i < Ancestors.length; i++) {
        var currAncestor = Ancestors[i];
        if (currAncestor) {
            if (currAncestor.querySelectorAll("input[type=submit]")) {
                currAncestor.addEventListener("submit", function () {
                    /* Sumbit event --> submitted in page --> save details to BGP */
                    var userName;
                    var userPassword;
                    var AncestorNode;
                    /* Get all forms of password / email / text (username) */
                    var data_in = currAncestor.querySelectorAll("input[type=text], input[type=email], input[type=password]");
                    var i = 0;
                    while(i < Object.keys(data_in).length - 1){
                        if (data_in[i].type !== 'password' && data_in[i + 1].type === 'password') {
                            userName = data_in[i].value;
                            userPassword = data_in[i + 1].value;
                            AncestorNode = currAncestor.id;
                            break;
                        }
                        i = i + 1;
                    }
                    if (!userName && !userPassword) {
                        /* If didnt found yet */
                        for (var k = 0; k < Ancestors.length; k++) {
                            if (Ancestors[k] !== currAncestor) {
                                /* Get all forms of password / email / text (username) */
                                data_in = Ancestors[k].querySelectorAll("input[type=text], input[type=email], input[type=password]");
                                for (var l = 0; l < Object.keys(data_in).length - 1; l++) {
                                    if (data_in[l].type !== 'password' && data_in[l + 1].type === 'password') {
                                        userName = data_in[l].value;
                                        userPassword = data_in[l + 1].value;
                                        AncestorNode = Ancestors[k].id;
                                        break;
                                    }
                                }
                            }
                        }
                    }
                    var details = {url: url, parent_id: AncestorNode, uname: userName, password: userPassword};
    
                    chrome.runtime.sendMessage({request: "getDetails", details: details});
                    /* BGP gets the message and update when needed */
                });
                if (user_content) {
                    /* If it is ---> Fill forms */
                    if (user_content && user_content[url] && user_content[url][currAncestor.id]) {
                        var users = user_content[url][currAncestor.id];
                        /* Get all forms of password / email / text (username) */
                        var data_in = currAncestor.querySelectorAll("input[type=text], input[type=email], input[type=password]");
                        for (var j = 0; j < Object.keys(data_in).length - 1; j++) {
                            if (data_in[j].type !== 'password' && data_in[j + 1].type === 'password') {
                                /* Check if next box is the password ---> username and then password */
                                var passwordsDB = document.getElementById("passwordsDB");
                                if (!passwordsDB){
                                    passwordsDB = document.createElement("DATALIST");
                                }
                                passwordsDB.setAttribute("id", "passwordsDB");
                                currAncestor.appendChild(passwordsDB);
                                for (var usr in users) {
                                    var children = document.getElementById("passwordsDB").children;
                                    var child;
                                    for (child = 0; child < children.length; child++) {
                                        if (children[child].value === usr)
                                            break;
                                    }
                                    if (child !== children.length)
                                        continue; 
                                    var option = document.createElement("OPTION");
                                    option.setAttribute("value", usr);
                                    document.getElementById("passwordsDB").appendChild(option);
                                }
                                data_in[j].setAttribute("list", "passwordsDB");
                                /* Fill username and password bullets */
                                data_in[j].value = Object.keys(users)[0];
                                data_in[j+1].value = users[data_in[j].value];
                                data_in[j].focus();
                                data_in[j].onblur = function () {
                                    if (users[data_in[j].value])
                                        data_in[j + 1].value = users[data_in[j].value];
                                };
                                break;
                            } 
                            /* if not ---> Advance */
                        }
                    }
                }
            }
        }
    }
}
/* Case 2: Didnt found password bullets in page */
else {
    if (url)
        chrome.runtime.sendMessage({request: 'updateDB', url: url});
}

/* Function which looking for forms */

function FindAncestorForForm(node){
    while (node.parentNode){
        if (node.parentNode.nodeName.toLowerCase() === 'form'){
            break;
        }
        node = node.parentNode;
    }
    return node.parentNode;
}