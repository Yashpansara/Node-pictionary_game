'use strict';


let username;
let room;
let socket=io();

const display_user= function(user)
{
    var div = document.querySelector(".username");
    var divClone = div.cloneNode(true);
    divClone.textContent=user;
    document.querySelector('.div1-up').append(divClone);

};

const display_chat =function(user,text)
{
    var div=document.querySelector(".chat");
    var divClone=div.cloneNode(true);
    divClone.querySelector('h4').textContent=user;
    divClone.querySelector('p').textContent=text;
    document.querySelector('.div3-up').append(divClone);
};


const change_html=function()
{
    const outer=document.querySelector('.outer');
    const main=document.querySelector('.main');
    outer.classList.toggle('hidden');
    main.classList.toggle('hidden');
};

const after_join=function()
{
    change_html();
    document.querySelector('#room-id').textContent=room;
    display_user(username);
    const i1=document.querySelector('#i1');
    const i21=document.querySelector('#i21');
    const i22=document.querySelector('#i22');
    i1.value="";
    i21.value="";
    i22.value="";
}


const join1=document.querySelector('.join1');
join1.addEventListener('click',function(){

    const i1=document.querySelector('#i1');
    if(!i1.value)return;

    const data={};
    data.type=1;
    data.username=i1.value;
    data.room=0;
    
    socket.emit('hello',data);   
});

const join2=document.querySelector('.join2');
join2.addEventListener('click',function(){
    const i21=document.querySelector('#i21');
    const i22=document.querySelector('#i22');

    if(!i21.value || !i22.value)return;

    const data={};
    data.type=2;
    data.username=i21.value;
    data.room=Number(i22.value);

    socket.emit('hello',data);       
});

socket.on('hello-r',(flag,data)=>{
    username=data.username;
    room=data.room;
    after_join();
});

socket.on('new-member',(username)=>{
    display_user(username);
});

socket.on('member-data',arr=>{
    for(const user of arr)display_user(user);
});

const leave=document.querySelector("#leave");
leave.addEventListener('click',function(){
    socket.emit('leave',username,room);
    
    // change_html();

    username="";
    room=0;
    let parent=document.querySelector('.div1-up');
    Array.from(parent.children).forEach(child => {
        if (child !== parent.firstElementChild) {
            parent.removeChild(child);
        }
    });

    parent=document.querySelector('.div3-up');
    Array.from(parent.children).forEach(child => {
        if (child !== parent.firstElementChild) {
            parent.removeChild(child);
        }
    });

    change_html();


});

socket.on('leave-member',(username)=>{
    let member=document.querySelector('.div1-up').children;
    for(let i=0;i<member.length;++i)
    {
        if(member[i].textContent==username)
        {
            member[i].remove();
            break;
        }
    }
});


const send=document.querySelector("#send");
send.addEventListener('click',function(){
    
    const text=document.querySelector('#chat-text').value;
    if(text=="")return;
    socket.emit('send-text',username,room,text);
    display_chat(username,text);
    document.querySelector('#chat-text').value="";

});

socket.on('receive-text',(user,text)=>{
    display_chat(user,text);
});






