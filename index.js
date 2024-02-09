import express from "express";
import path from "path";
import { createServer } from 'node:http';
import { dirname } from "path";
import { fileURLToPath } from "url";
const __dirname = dirname(fileURLToPath(import.meta.url));
import { Server } from 'socket.io';
import bodyParser from "body-parser";
import { type } from "os";

'use strict';

// way to use socket io
// let express=require('express');
// let app=express();
// let httpServer=require('http').createServer(app);
// let io=require('socket.io')(httpServer);

// let PORT=process.env.PORT || 3000;
// httpServer.listen(PORT,()=>console.log(`server started on ${PORT}`));

const app = express();
const port = 3000;
const server = createServer(app);
const io=new Server(server);
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

let room_data=new Map();


function random_generator()
{
  let mini=100000;
  let maxi=999999;
  let diff=maxi-mini;
  let rand=Math.random();
  rand=Math.floor(rand*(maxi-mini));
  rand+=mini;
  return rand;
}

io.on('connection',socket=>{
  console.log('connected');

  socket.on('disconnect',()=>{
    console.log("disconnect");
  });

  socket.on('hello',(data)=>{
    if(data.type===1)
    {
      const rooms = io.of("/").adapter.rooms;
      let r=random_generator();
      while(rooms.has(r))r=random_generator();
      
      socket.join(r);
      data.room=r;

      let s=new Array();
      room_data.set(r,s);
    }
    else if(data.type===2)
    {
      const rooms = io.of("/").adapter.rooms;
      if(rooms.has(data.room))socket.join(data.room);
      else return;
    }

    let flag=true;
    socket.emit('hello-r',flag,data);

    const arr=new Array();
    const members=room_data.get(data.room);
    for(const tmp of members )arr.push(tmp.data);
    socket.emit('member-data',arr);

    socket.data=data.username;
    room_data.get(data.room).push(socket);

    if(data.type===2)socket.to(data.room).emit('new-member',data.username);

  });

  socket.on('leave',(username,room)=>{
    socket.leave(room);

    if(room_data.has(room)) {
      const roomMembers = room_data.get(room);
      const updatedRoomMembers = roomMembers.filter(tmp => tmp.id !== socket.id);
      room_data.set(room, updatedRoomMembers);
    }
    socket.data="";
    socket.to(room).emit('leave-member',username);
  });

  socket.on('send-text',(username,room,text)=>{
    socket.to(room).emit('receive-text',username,text);
  });


  socket.on('draw',(data,room)=>{
    socket.to(room).emit('ondraw',data);
  });

  socket.on('mousedown',(data,room)=>{
    socket.to(room).emit('onmousedown',data);
  });

  socket.on('change',(data,room)=>{
    socket.to(room).emit('change',data);
  });


});



app.get("/", (req, res) => {
    res.render(path.join(__dirname, 'public','index.html'));
});


server.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
