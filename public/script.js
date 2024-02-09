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


// let canvas = document.querySelector('canvas');
// let parentDiv = document.querySelector('.div2-up');
// canvas.style.width='100%';
// canvas.style.height='100%';
// canvas.style.boxSizing = 'border-box';

// let ctx=canvas.getContext('2d');

// let isDrawing = false;
// let lastX = 0;
// let lastY = 0;

// function draw(x, y) {
//     if (!isDrawing) return;
    
//     ctx.beginPath();
//     ctx.moveTo(lastX, lastY);
//     ctx.lineTo(x, y);
//     ctx.stroke();

//     lastX = x;
//     lastY = y;
// }

// canvas.addEventListener('mousedown', function(event) {
//     isDrawing = true;
//     let pos = getMousePos(canvas, event);
//     lastX = pos.x;
//     lastY = pos.y;
// });

// canvas.addEventListener('mousemove', function(event) {
//     let pos = getMousePos(canvas, event);
//     draw(pos.x, pos.y);
// });

// canvas.addEventListener('mouseup', function() {
//     isDrawing = false;
// });

// function getMousePos(canvas, event) {

//     var rect = canvas.getBoundingClientRect(),
//       scaleX = canvas.width / rect.width,
//       scaleY = canvas.height / rect.height;
  
//     return {
//       x: (event.clientX - rect.left) * scaleX,
//       y: (event.clientY - rect.top) * scaleY
//     }
// }


let canvas = document.querySelector('canvas');
let ctx=canvas.getContext('2d');
canvas.style.width='100%';
canvas.style.height='100%';
canvas.style.boxSizing = 'border-box';

let is_painting =false;
let lineWidth=0.5;

let clear=document.getElementById('clear');
clear.addEventListener('click',()=>{
    socket.emit('clear',room);
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.beginPath();

    let data={};
    data.action="clear";
    socket.emit('change',data,room);
});

let select_color=document.getElementById('select-color');
select_color.addEventListener('change',()=>{
    ctx.strokeStyle=select_color.value;
    ctx.beginPath();

    let data={};
    data.action="color";
    data.color=select_color.value;
    socket.emit('change',data,room);

});

let font=document.getElementById('font');
font.addEventListener('change',()=>{
    // lineWidth=font.value;
    ctx.lineWidth=font.value;
    ctx.beginPath();

    let data={};
    data.action="font";
    data.lineWidth=font.value;
    socket.emit('change',data,room);

});

canvas.addEventListener('mousedown',(e)=>{
    is_painting=true;
    let pos = getMousePos(canvas, e);

    socket.emit('mousedown',pos,room);

    ctx.moveTo(pos.x,pos.y);
});

canvas.addEventListener('mouseup',(e)=>{
    is_painting=false;
});

socket.on('ondraw',(data)=>{
    // ctx.lineWidth=data.lineWidth;
    // ctx.strokeStyle=data.color;
    ctx.lineTo(data.x,data.y);
    ctx.stroke();
});
socket.on('onmousedown',(data)=>{
    ctx.moveTo(data.x,data.y);
});
socket.on('change',(data)=>{
    if(data.action=="clear")
    {
        ctx.clearRect(0,0,canvas.width,canvas.height);
        ctx.beginPath();
    }
    else if(data.action=="font")
    {
        ctx.lineWidth=data.lineWidth;
        ctx.beginPath();
    }
    else if(data.action=="color")
    {
        ctx.strokeStyle=data.color;
        ctx.beginPath();
    }
});

const draw = (e) =>{
    if(!is_painting)return;
    // ctx.lineWidth=lineWidth;
    ctx.lineCap='round';
    let pos = getMousePos(canvas, e);

    const data={};
    data.x=pos.x;
    data.y=pos.y;
    data.lineWidth=font.value;
    data.color=select_color.value;

    socket.emit('draw',data,room);

    ctx.lineTo(pos.x,pos.y);
    ctx.stroke();
}
canvas.addEventListener('mousemove',draw);


function getMousePos(canvas, event) {
    var rect = canvas.getBoundingClientRect(),
      scaleX = canvas.width / rect.width,
      scaleY = canvas.height / rect.height;
  
    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY
    }
}

