// const { enc } = require("crypto-js");

var is_connected = false;
var user = "";          
var KeyPassword = "";      
var respone;
var masterPassword = "";
var passwordForServer="";
var MacKey="";  //for checking autantication

var user_content = {}; 
var socket = io('http://localhost:3000');

var user_web = undefined;
var password_web  = undefined;
var url_web = undefined;
var form_web = undefined;



chrome.tabs.onActivated.addListener(function (active) { 
    var tabId = active.tabId;
    if (is_connected) {
        chrome.tabs.get(tabId, function (tab) {
            if (tab && !tab.url.startsWith("chrome://")){
                
                chrome.tabs.executeScript(tabId, {
                    file: 'content.js'
                });
            }
        });
    }
});

chrome.tabs.onUpdated.addListener(function (tabId, change) {
    if (is_connected) {
        chrome.tabs.get(tabId, function (tab) {
            if (tab && !tab.url.startsWith("chrome://")){

                if ("complete" ===  change.status) {
                    chrome.tabs.executeScript(tabId, {
                        file: 'content.js'
                    });
                }
            }
        });
    }
});


socket.on('server_ready', function (data) {
    console.log("please sign in");
    chrome.runtime.onMessage.addListener(function(message){
        var request = message.request;
        switch (request){
            case "login":
                user = message.user;
                passwordForServer =CryptoJS.HmacSHA256(message.password,message.password+"1").toString() ;
                socket.emit(request, {user: user, password: passwordForServer});
                masterPassword = message.password;
                KeyPassword=CryptoJS.HmacSHA256(message.password,message.password+"2").toString();
                MacKey=CryptoJS.HmacSHA256(message.password,message.password+"3").toString();
                break;
            case "register":
                user = message.user;
                passwordForServer =CryptoJS.HmacSHA256(message.password,message.password+"1").toString() ;
                socket.emit(request, {user: user, password: passwordForServer});
                break;
            case "getDetails":
                if (is_connected) {
                    user_web = message.details.uname;
                    password_web  = message.details.password;
                    url_web = message.details.url;
                    form_web = message.details.parent_id;
                }
                break;
            case "updateDB":
                if ( user_web && password_web && is_connected ) {
                    chrome.tabs.query({active: true, lastFocusedWindow: true}, function (tabs) {
                        if (tabs && tabs[0]) {
                            var Turl = tabs[0].url.split('/');
                            var currURL = Turl[0] + "//" + Turl[2] + "/";
                            if (message.url === currURL) {
                                if (user_content) {
                                    // check if the url already exist
                                    if (user_content[url_web]) { 
                    
                                        if (user_content[url_web][form_web]) { 
                    
                                            if (user_content[url_web][form_web][user_web]) { 
                    
                                                if (user_content[url_web][form_web][user_web] !== password_web ) {
                                                   //if password is diffrent
                                                    if (confirm("Do you want to update the password that saved for this website?")) {
                                                        user_content[url_web][form_web][user_web] = password_web ;
                                                        updateDB();
                                                    }
                                                }
                                            } else {
                                                // saving user
                                                user_content[url_web][form_web][user_web] = password_web ;
                                                updateDB();
                                            }
                                        } else {
                                            user_content[url_web][form_web] = {};
                                            user_content[url_web][form_web][user_web] = password_web ;
                                            updateDB();
                                        }
                                    }
                                    else {   // update new website to account
                                        user_content[url_web] = {};
                                        user_content[url_web][form_web] = {};
                                        user_content[url_web][form_web][user_web] = password_web ;
                                        updateDB();
                                    }
                                } //cleaning the fields
                                user_web = undefined;
                                password_web  = undefined;
                                url_web = undefined;
                                form_web = undefined;
                            }
                        }
                    });
                }
                break;
        }
    });
});




socket.on('login_ACK', function (data) {
    respone = data.response;
    // get popup window
    var views = chrome.extension.getViews({
        type: "popup"
    });
    for (var i = 0; i < views.length; i++) {
        views[i].document.getElementById('status').innerHTML = respone;
    }
    if (respone === "signed in") {
        is_connected = true;
        var content = {};
        if(data.content){
        var details = data.content.split('\n');
        var MacPlace=details.length-1;
        // console.log("maxkey: " +MacKey);
        // console.log("mackry details: " + details[MacPlace]);
        if (details[MacPlace] === MacKey) {
          
            makeDecryptText(content,data);
           
            chrome.storage.local.set({'user_content': content, 'user': user}, function(){
                user_content = content;
            });
        }
        else{
            alert("SOMEONE CHANGED YOUR DATA!!!!");
        }

        for (var i = 0; i < views.length; i++) {
            views[i].close(); 
        }

        // refresh all saved pages on sign in
        chrome.tabs.getAllInWindow(null, function (tabs) {
            for (var i = 0; i < tabs.length; i++) {
                if (tabs[i] && !tabs[i].url.startsWith("chrome://")){
                    var tab_url = tabs[i].url.split('/');
                    tab_url = tab_url[0] + '//' + tab_url[2] + '/';
                    if (user_content[tab_url]) {
                        chrome.tabs.update(tabs[i].id, {url: tabs[i].url});
                    }
                    chrome.tabs.executeScript(tabs[i].id, {
                        file: 'content.js'
                    });
                }
            }
        });
    }
}
    console.log(respone);
});

socket.on('register_ACK ', function (data) {
    respone = data.response;
    var views = chrome.extension.getViews({
        type: "popup"
    });
    for (var i = 0; i < views.length; i++) {
        views[i].document.getElementById('status').innerHTML = respone;
    }
    console.log(respone);
});


function updateDB(){
    if (is_connected) {
        chrome.storage.local.set({'user_content': user_content});
        var text = makeEncryptText() +"\n"+ MacKey;
        // 
        // console.log("text: "+text + "mackey"+MacKey);
        socket.emit('update_data', {
            user: user,
            password: passwordForServer,
            content: text
        });
    }
}

socket.on('update_ACK', function (data) {
    if (is_connected) {
        var content = {};
        makeDecryptText(content,data);
        chrome.storage.local.set({'user_content': content}, function () {
            user_content = content;

        });
    }
});

function makeDecryptText(content,data){
    var details = data.content.split('\n');
        var tempContent= "";
        for (var i = 0; i < details.length - 1; i++) {
            tempContent += details[i];
        }
        decContent = CryptoJS.AES.decrypt(tempContent,KeyPassword).toString(CryptoJS.enc.Utf8);
        var data = decContent.split("\n");
        for(var i = 0; i < data.length ; i++){
            dataSpaces = data[i].split(" ");
            if(dataSpaces.length===4){
                if (!content[dataSpaces[0]])
                    content[dataSpaces[0]] = {};
                if (!content[dataSpaces[0]][dataSpaces[1]])
                    content[dataSpaces[0]][dataSpaces[1]] = {};
                content[dataSpaces[0]][dataSpaces[1]][dataSpaces[2]] = dataSpaces[3];
            }
        }
}

function makeEncryptText(){
    var text = "";
    for (var url in user_content) {
        for (var form in user_content[url]) {
            for (var usr in user_content[url][form]) {
                text += url+" "+form+" "+usr+" "+user_content[url][form][usr]+"\n";
            }
        }
    }
    var encText = CryptoJS.AES.encrypt(text,KeyPassword);
    return encText;
}