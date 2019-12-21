const path = require('path')
const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const Filter = require('bad-words')
const { generateMessage, generateLocationMsg } = require('./utilis/messages')
const { addUser, removeUser, getUser, getUsersInRoom} = require('./utilis/user')

const app = express()
const server = http.createServer(app)
const io = socketio(server)

const port = process.env.PORT || 4444
const publicDiretoryPath = path.join(__dirname, '../public')


app.use(express.static(publicDiretoryPath))

io.on('connection', (socket)=>{
    console.log('New COnnection')

    socket.on('join', (details, callback)=>{
        const {error, user} = addUser({id: socket.id, ...details})

        if(error){
            return callback(error)
        }

        socket.join(user.room)

        socket.emit('messages', generateMessage(`Welcome ${user.username}!`))
        socket.broadcast.to(user.room).emit('messages', generateMessage(`${user.username} has joined!`))
        
        io.to(user.room).emit('roomData',{
            room : user.room,
            users : getUsersInRoom(user.room)
        })

        callback()
    })

    socket.on('message', (msg, callback)=>{
        const filter = new Filter()

        if(filter.isProfane(msg)){
            return callback('Profanity is not allowed')
        }
        
        const user = getUser(socket.id)

        io.to(user.room).emit('messages', generateMessage(user.username, msg))
        callback()
    })

    socket.on('disconnect',()=>{
        const user = removeUser(socket.id)
        
        if(user){
            io.to(user.room).emit('messages', generateMessage(`${user.username}  has left!`))
            io.to(user.room).emit('roomData',{
                room : user.room,
                users : getUsersInRoom(user.room)
            })
        }


    })

    socket.on('sendlocation',(coords, callback)=>{
        const user = getUser(socket.id)

        io.to(user.room).emit('location-message',generateLocationMsg( user.username, `https://google.com/maps?q=${coords.latitude},${coords.longtitude}`))
        callback('Location Shared!')
    })


})


server.listen(port, ()=>{
    console.log('listening at port number : '+port)
})