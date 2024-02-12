import express from "express";
import path from "path";
import { createServer } from 'node:http';
import { dirname } from "path";
import { fileURLToPath } from "url";
const __dirname = dirname(fileURLToPath(import.meta.url));
import { Server } from 'socket.io';
import bodyParser from "body-parser";
import { type } from "os";
import { generateSlug } from "random-word-slugs";

'use strict';

// way to use socket io
// let express=require('express');
// let app=express();
// let httpServer=require('http').createServer(app);
// let io=require('socket.io')(httpServer);

// let PORT=process.env.PORT || 3000;
// httpServer.listen(PORT,()=>console.log(`server started on ${PORT}`));

const app = express();
const port = process.env.PORT || 3000;
const server = createServer(app);
const io=new Server(server);
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

let room_data=new Map();
let start;


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
  console.log('connected',socket.id);

  function leave(){
    let tmp=socket.data;
    let username=tmp.username;
    let room=tmp.room;
    socket.leave(room);

    if(room_data.has(room)) {
      const roomMembers = room_data.get(room).player;
      const updatedRoomMembers = roomMembers.filter(tmp => tmp.id !== socket.id);
      room_data.get(room).player=updatedRoomMembers;

      if(room_data.get(room).complete.has(socket.id))room_data.get(room).complete.delete(socket.id);
      if(room_data.get(room).draw.has(socket.id))room_data.get(room).draw.delete(socket.id);
      if(room_data.get(room).ans.has(socket.id))room_data.get(room).ans.delete(socket.id);
      if(room_data.get(room).name.has(socket.id))room_data.get(room).name.delete(socket.id);
      if(room_data.get(room).correct.has(socket.id))room_data.get(room).correct.delete(socket.id);

      if(room_data.get(room).player.length==0)
      {
        clearInterval(room_data.get(room).time);
        room_data.delete(room);
      }
      else if(socket.id==room_data.get(room).current)
      {
        clearInterval(room_data.get(room).time);
        io.to(room).emit('emergency-stop');
        setTimeout(after_start,2000,room);
      }
    }

    socket.data="";
    socket.to(room).emit('leave-member',username);
  }

  socket.on('disconnect',()=>{
    console.log('disconnected',socket.data);

    leave();
  });

  socket.on('hello',(data)=>{
    if(data.type===1)
    {
      const rooms = io.of("/").adapter.rooms;
      let r=random_generator();
      while(rooms.has(r))r=random_generator();
      
      socket.join(r);
      data.room=r;

      let s={};
      s.player=new Array();
      s.current=-1;
      s.time;
      s.word;
      s.correct=new Set();
      s.draw=new Map();
      s.ans=new Map();
      s.name=new Map();
      s.complete=new Set();

      room_data.set(r,s);
    }
    else if(data.type===2)
    {
      const rooms = io.of("/").adapter.rooms;
      if(rooms.has(data.room))
      {
        if(room_data.get(data.room).current==-1)socket.join(data.room);
        else
        {
          socket.emit('join-fail',1);
          return;
        }
      }
      else 
      {
        socket.emit('join-fail',0);
        return;
      }
    }

    let flag=true;
    socket.emit('hello-r',flag,data);

    const arr=new Array();
    const members=room_data.get(data.room).player;
    for(const tmp of members )arr.push(tmp.data.username);
    socket.emit('member-data',arr);

    let tmp={};
    tmp.username=data.username;
    tmp.room=data.room;
    socket.data=tmp;
    room_data.get(data.room).player.push(socket);
    room_data.get(data.room).name.set(socket.id,data.username);

    if(data.type===2)socket.to(data.room).emit('new-member',data.username);

  });

  socket.on('leave',()=>{
    leave();
  });



  socket.on('send-text',(text)=>{
    let tmp=socket.data;
    let username=tmp.username;
    let room=tmp.room;

    if(socket.id==room_data.get(room).current)return;
    if(room_data.get(room).correct.has(socket.id))return;
    if(room_data.get(room).word==text)
    {
      room_data.get(room).correct.add(socket.id);

      let val;
      if(room_data.get(room).ans.has(socket.id))val=room_data.get(room).ans.get(socket.id);
      else val=0;
      room_data.get(room).ans.set(socket.id,val+1);

      if(room_data.get(room).draw.has(room_data.get(room).current))val=room_data.get(room).draw.get(room_data.get(room).current);
      else val=0;
      room_data.get(room).draw.set(room_data.get(room).current,val+1);

      // io.to(room).emit('receive-text',username,"",1,socket.id);
      socket.emit('receive-text',username,text,socket.id);
      socket.to(room).emit('receive-text',"system",`${username} give correct answer.`,socket.id);
      socket.emit('receive-text',"system",`you give correct answer.`,socket.id);
    }
    else
    {
      io.to(room).emit('receive-text',username,text,socket.id);
    }
  });






  socket.on('draw',(data)=>{
    let tmp=socket.data;
    let username=tmp.username;
    let room=tmp.room;
    socket.to(room).emit('ondraw',data);
  });

  socket.on('mousedown',(data)=>{
    let tmp=socket.data;
    let username=tmp.username;
    let room=tmp.room;
    socket.to(room).emit('onmousedown',data);
  });

  socket.on('change',(data)=>{
    let tmp=socket.data;
    let username=tmp.username;
    let room=tmp.room;
    socket.to(room).emit('change',data);
  });

function word_generator(){
  const options = {
    format: "camel",
    partsOfSpeech: ["noun"],
    categories: {
      noun: ["animals", "food", "people", "sports"],
      },
  };

  return generateSlug(1, options);

}


  const after_start=function(room)
  {
    if(!room_data.has(room))return;

      room_data.get(room).correct.clear();
      for(const tmp of room_data.get(room).player)
      {
        if(!room_data.get(room).complete.has(tmp.id))
        {
          room_data.get(room).word = word_generator();
          io.to(room).emit('my-turn',tmp.id,tmp.data.username,room_data.get(room).word);
          room_data.get(room).complete.add(tmp.id);
          room_data.get(room).current=tmp.id;
          break;
        }
      }

      room_data.get(room).time=setInterval(()=>{
      let flag=0;
      room_data.get(room).correct.clear();
      for(const tmp of room_data.get(room).player)
      {
        if(!room_data.get(room).complete.has(tmp.id))
        {
          room_data.get(room).word = word_generator();
          io.to(room).emit('my-turn',tmp.id,tmp.data.username,room_data.get(room).word);
          room_data.get(room).complete.add(tmp.id);
          room_data.get(room).current=tmp.id;
          flag=1;
          break;
        }
      }

      if(flag==0)
      {
        clearInterval(room_data.get(room).time);

        // console.log(room_data.get(room).draw);
        // console.log(room_data.get(room).ans);

        let result=new Array();
        for (let socket of room_data.get(room).player) {
          let tmp=0;
          if(room_data.get(room).ans.has(socket.id))tmp+=room_data.get(room).ans.get(socket.id)*100;
          if(room_data.get(room).draw.has(socket.id))tmp+=room_data.get(room).draw.get(socket.id)*50;
          let t={};
          t.id=socket.id;
          t.point=tmp;
          result.push(t);
        }

        for(let i=0;i<result.length;++i)
        {
          for(let j=i;j<result.length;++j)
          {
            if(result[i].point>result[j].point)
            {
              const tmp=result[i];
              result[i]=result[j];
              result[j]=tmp;
            }
          }
        }

        let final_result=new Array();
        let rank=1;
        for(let i=result.length-1;i>=0;--i)
        {
          let tmp={};
          tmp.rank=rank;
          tmp.name=room_data.get(room).name.get(result[i].id);
          tmp.point=result[i].point;
          tmp.id=result[i].id;
          final_result.push(tmp);
          if(i!==0 && result[i].point>result[i-1].point)++rank;
        }
        console.log(final_result);
        io.to(room).emit('result',final_result);


        room_data.get(room).current=-1;
        room_data.get(room).complete.clear();
        room_data.get(room).correct.clear();
        room_data.get(room).draw.clear();
        room_data.get(room).ans.clear();
        console.log('round completed');
      }

    },50000);
  }

  socket.on('start',()=>{
    let tmp=socket.data;
    let username=tmp.username;
    let room=tmp.room;

    if(socket.id==room_data.get(room).player[0].id && room_data.get(room).current===-1)
    {
      console.log('round-started');
      io.to(room).emit('new-round');
      after_start(room);
    }
    else if(socket.id==room_data.get(room).player[0].id && room_data.get(room).current!=-1)
    {
      socket.emit('start-res','game is already started');
    }
    else
    {
      socket.emit('start-res','Only admin can start the game');
    }
  });

});




app.get("/", (req, res) => {
    res.render(path.join(__dirname, 'public','index.html'));
});


server.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
