console.log("starting server");
var io = require('socket.io').listen(3000);
console.log("server is on");



var CryptoJS = require("crypto-js");
var mongoose = require("mongoose");
mongoose.Promise = global.Promise;
const keys = require('./config/keys');
mongoose.connect(keys.mongodbLogIn,{useNewUrlParser: true, useUnifiedTopology: true })
.catch(err => console.log("Not success connect to server"));;
//the data that save in the DB with encrypted fields
var nameSchema = new mongoose.Schema({
    A: String,
    B: String,
    C: String
});
var contentSchema = new mongoose.Schema({
    X: String,
    Y: String
});
Schema = mongoose.Schema,
ObjectId = Schema.ObjectId;
var User = mongoose.model("User", nameSchema);
var Content =mongoose.model("Content",contentSchema);

var Msocket="";

function login(socket, data){
    console.log(data.user + " login request");
    //find if the user exist in the DB
    User.findOne({A: data.user},'B C ',function (err, docs) {
        if (docs){
            console.log("user " + data.user + " exists in data base");
            var key = data.password + docs.B; // password + salt
            var hashed = CryptoJS.HmacSHA256(key, data.user).toString(CryptoJS.enc.Base64); 
            
            if (hashed === docs.C){ //check if the password correct
                console.log("password correct");
                var userContentName = CryptoJS.HmacSHA256(key, data.password).toString(); // hash it
                Msocket=socket;
                Content.findOne({X: userContentName},'Y',function (err, contentDocs){
                if(contentDocs){ // send respone to the client witrh the data
                    socket.emit('login_ACK', { response: 'signed in', content: contentDocs.Y})
                } else console.log(" didn't find records of content of this user");
                 } ) 
                return;     
        }      
        else{
            console.log("password incorrect");  //if password incorrect send respone to the client
            socket.emit('login_ACK', { response: 'password incorrect' });
            return;
        }           
            
            
    }else{
        console.log("user is not exists");
        socket.emit('login_ACK', { response: 'user is not exists' });
        return;
    } 
        
    })

}




function register(socket, data){
    
    console.log(data.user + " register request");
       // check if user name exists     
     User.findOne({A: data.user},function (err, docs) {
        if (docs){
            console.log("this user name allready exist");
            socket.emit('register_ACK ', { response: 'invalid user name' });
            return;
            
        }     
        //  encrypt the data before saving in db            
            var salt = CryptoJS.lib.WordArray.random(18); 
            var key = data.password + salt; 
            var hashed = CryptoJS.HmacSHA256(key, data.user).toString(CryptoJS.enc.Base64); 
            var userContentName = CryptoJS.HmacSHA256(key, data.password).toString(); //encrypt the content
            var NewuserContentName= new Content({X:userContentName});
            NewuserContentName.save(function(err){
                if(err){
                    console.log("problem in creating new user content");
                }else console.log("succed new user content");
            })
            var myData = new User({A:data.user,B:salt,C:hashed});//create new user
            myData.save(function (err){
                if (!err) {
                console.log(data.user + " registered successfully");
                socket.emit('register_ACK ', { response: data.user + ' registered' });
                }else console.log('error register')
            });  

    } )
}

function update_data(data){
    var salt="";
        User.findOne({A: data.user},'B ',function (err, docs) {//find the data of the user
            if(docs){
                 salt=docs.B;
                 var key = data.password + salt;
                 var userContentName = CryptoJS.HmacSHA256(key, data.password).toString(); 
                 Content.findOne({X: userContentName}, function (err, doc){
                    if(doc){
                       doc.Y=data.content;
                       doc.save();
                       Msocket.emit("update_ACK", {content: data.content});
                    }else
                    console.log("no doc");
                  });
            }
        })
}
function unregister(data){
    //find user data
    var salt="";
    console.log("user data befor unreg: "+ data.user)
    User.findOne({A: data.user},'B',function (err, docs) {
        if(docs){
             salt=docs.B;
             var key = data.password + salt;
             var userContentName = CryptoJS.HmacSHA256(key, data.password).toString(); 
             Content.findOneAndDelete({X: userContentName }, function (err, docs) { 
                 if(!docs){
                    console.log("no found content unreg") 
                 }else console.log("found content unreg")
                if (err){ 
                    console.log("user didn't succed to delete his content") 
                } 
                else{ 
                    console.log("Deleted content : ", docs); 
                } 
            });
        }else console.log(" didn't find user from unreg");
    })
    //find user content
    User.findOneAndDelete({A: data.user }, function (err, docs) { 
        if (err){ 
            console.log("user didn't succed to delete himself") 
        } 
        else{ 
            console.log("Deleted User : ", docs); 
        } 
    });
    Msocket.emit("account_deleted", {});
    
    Msocket="";
}


io.on('connection', function (socket) {

    socket.emit('server_ready', { need: 'request' });

    socket.on('login', function (data) {
        login(socket, data);
    });

    socket.on('register', function (data) {
        register(socket, data);
    });

    socket.on('update_data', function(data){
       update_data(data);  
    });

    socket.on('unregister', function(data){ 
        unregister(data);
    });

    socket.on('sign_out', function(data){
        Msocket="";
    });
});
