/**************
* Timer casse couille à faire
**************/

if (NodeList.prototype.forEach === undefined){
    NodeList.prototype.forEach = function(callback){
        [].forEach.call(this, callback)
    }
}

let terms = [{
    time: 45,
    divide: 60,
    text: "moins d'une minute"
},{
    time: 90,
    divide: 60,
    text: "une minute"
}, {
    time: 45 * 60,
    divide: 60,
    text: "% minutes"
}, {
    time: 90 * 60,
    divide: 60 * 60,
    text: "environ une heure"
}, {
    time: 24 * 60 * 60,
    divide: 60 * 60,
    text: "% heures"
}, {
    time: 42 * 60 * 60,
    divide: 24 * 60 * 60,
    text: "environ un jour"
}, {
    time: 30 * 24 * 60 * 60,
    divide: 24 * 60 * 60,
    text: "% jours"
}, {
    time: 45 * 24 * 60 * 60,
    divide: 24 * 60 * 60 * 30,
    text: "environ un mois"
}, {
    time: 365 * 24 * 60 * 60,
    divide: 24 * 60 * 60 * 30,
    text: "% mois"
}, {
    time: 365 * 1.5 * 24 * 60 * 60,
    divide: 24 * 60 * 60 * 365,
    text: "environ un an"
}, {
    time: Infinity,
    divide: 24 * 60 * 60 * 365,
    text: "% ans"
}]


/***********************************
* Partie intéraction nodeJs / client
***********************************/

$(document).ready(function(){

    let login     = $('#login');
    let chat      = $('#chat');
    let loader    = $('.loader');

    let username  = $("#username");
    let message   = $("#message");

    let socket    = io();

    $('#login-btn').on('click', function(e){
        e.preventDefault();
        socket.emit('login request', username.val());
    });

    socket.on('login request error', function(){
        errorInput(true);
    });

    socket.on('login request success', function(){
        transitToChat();
    });

    socket.on('disconnect', function(){
        $(chat).hide(500);
        $(login).hide();
        $('p[id="loader-text"]').text("La connexion au server a été réinitialisée. Tentative de reconnexion en cours, merci de patienter.");
        $(loader).show(200);
    });

    socket.on('reconnect', function(){
        $(loader).hide();
        $(login).show(300);
    });

    $('#send').on('click', function(e){
        e.preventDefault();
        socket.emit("new message", message.val());
    });

    socket.on('new message error', function(){
        errorInput(true);
    });

    socket.on('new message success', function(){
        $('#message').val('');
    })

    socket.on('new message', function(username, color, message){
        errorInput(false);
        appendMessage(username, color, message);
    });

    socket.on('participants', function(participants){
        if(participants > 1){
            phrase = '<i class="info circle icon"></i> Il y a <b>' + participants + '</b> participants connectés sur le chat.';
        } else {
            phrase = '<i class="info circle icon"></i> Il n\'y a qu\'une personne connectée sur le chat.';
        }

        $('.participants').html(phrase);
    });

    socket.on('new activity', function(username, color, phrase){
        addActivity(username, color, phrase);
    });

    socket.on('message history', function(phrase){
        for(i = 0;i < phrase.length;i++){
            $('#comments').prepend('<div class="comment"><div class="avatar">H</div><div class="content"><div class="metadata"><div class="date">Message placé dans l\'historique temporaire du chat</div></div><div class="text"> '+phrase[i]+'</div></div></div></div>');
        }
    });

    socket.on('users', function(users){
        $('.users-items').html('');

        for(i = 0;i < users.length;i++){
            if(users[i] != null)
            {
                let split = users[i].split('-|-');
                userOnline(split[0], split[1]);
            }
        }
    });

    // Functions

    function addActivity(username, color, phrase){
        $('.activity').html('<i class="info circle icon"></i> <b style="color:'+color+';">'+username+'</b> '+phrase+'');
        $('.activity-items').prepend('<div class="item"><div class="ui avatar" style="display:inline-block;">'+ format(username.charAt(0)) +'</div><div style="display:inline-block;" class="content"><div style="position:relative;top:6px;margin-left:2px;" class="header"> <b style="color:'+ color +';">'+ format(username) +'</b> '+ phrase +'</div></div></div>');
    }

    function userOnline(username, color){
        $('.users-items').prepend('<div class="item"><div class="ui avatar" style="display:inline-block;">'+ format(username.charAt(0)) +'</div><div style="display:inline-block;" class="content"><div style="position:relative;top:6px;margin-left:2px;" class="header"> <b style="color:'+ color +';">'+ format(username) +'</b></div></div></div>');
    }

    function errorInput(bool = true){
        if(bool === true) {
            $('#error-message').html('<div class="ui negative message"><i class="warning icon"></i> Une erreur est survenue avec l\'envoie de votre requête. Réessayez.</div><br />');
        } else {
            $('#error-message').html('');
        }
    }

    function appendMessage(username, color, message){
        $('#comments').prepend('<div class="comment"><div class="avatar">'+ format(username.charAt(0)) +'</div><div class="content"><div class="metadata"><div class="date" data-ago="'+ Math.floor(Date.now() / 1000) +'"></div></div><div class="text"> <b style="color:'+ color +';">' + format(username) + '</b> : ' + format(message) +'</div></div></div></div>');
        setTime();
    }

    function setTime(){
        document.querySelectorAll('[data-ago]').forEach(function(node){
            function setText() {
                let secondes = Math.floor((new Date()).getTime() / 1000 - parseInt(node.dataset.ago, 10))
                let prefix = 'Il y a '
                let wording = ""
                let term = null
                secondes = Math.abs(secondes);

                for (term of terms) {
                    if(secondes < term.time){
                        break
                    }
                }

                node.innerHTML = prefix + term.text.replace('%', Math.round(secondes / term.divide))

                let nextTick = secondes % term.divide
                if(nextTick === 0) {
                    nextTick = term.divide
                }


                window.setTimeout(function(){
                    if(node.parentNode) {
                        if(window.requestAnimationFrame)
                        {
                            window.requestAnimationFrame(setText)
                        } else {
                            setText()
                        }
                    }
                }, nextTick * 1000);
            }

            setText();
        })
    }

    function format(text) {
      return text
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#039;");
    }

    function transitToChat(){
        errorInput(false);
        $(login).hide(200);
        $('p[id="loader-text"]').text("Chargement de l'application en cours ...");
        $(loader).show(300);
        setTimeout(function(){
            $(loader).hide(300);
            $(chat).show(300);
        }, 3500);
    }

});
