const socket = io()
const messageForm = document.querySelector('#message-form')
const messageFormInput = messageForm.querySelector('input')
const messageFormButton = messageForm.querySelector('button')
const $messages = document.querySelector('#messages')

const messageTemplate = document.querySelector('#message-template').innerHTML
const locationTemplate = document.querySelector('#location-template').innerHTML
const sideBarTemplate = document.querySelector('#sidebar-template').innerHTML

const {username, room} = Qs.parse(location.search, {ignoreQueryPrefix : true})

const autoScroll = ()=>{
    const $newMessage = $messages.lastElementChild

    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    const visibleHeight = $messages.offsetHeight

    const containerHeight = $messages.scrollHeight

    const scrollOffset = $messages.scrollTop + visibleHeight

    if(containerHeight - newMessageHeight <= scrollOffset){
        $messages.scrollTop = $messages.scrollHeight
    }
}

socket.on('messages',(msg)=>{
    console.log(msg)
    const html = Mustache.render(messageTemplate, {
        username : msg.username,
        recieveMessage : msg.text,
        createdAt : moment(msg.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoScroll()
})

socket.on('location-message',(msg)=>{
    console.log(msg)
    const link = Mustache.render(locationTemplate, {
        username : msg.username,
        locationMessage : msg.url,
        createdAt : moment(msg.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', link)
    autoScroll()
})

socket.on('roomData',({room, users})=>{
    const html = Mustache.render(sideBarTemplate, {
        room : room.toUpperCase(),
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})

messageForm.addEventListener('submit',(e)=>{
    e.preventDefault()

    messageFormButton.setAttribute('disabled', 'disabled')

    const msg = e.target.elements.message.value
    //const msg = messageFormInput.value

    socket.emit('message', msg, (err)=>{

        messageFormButton.removeAttribute('disabled')
        messageFormInput.value = ''
        messageFormInput.focus()

        if(err){
            return console.log(err)
        }
        console.log('Message DElivered!')
    })
})

const locationButton = document.querySelector('#send-location')

locationButton.addEventListener('click',()=>{

    if(!navigator.geolocation){
        return alert('Geolocation not supported')
    }
    locationButton.setAttribute('disabled','disabled')

    navigator.geolocation.getCurrentPosition((position)=>{
        console.log(position)
        socket.emit('sendlocation',{
            latitude : position.coords.latitude,
            longtitude : position.coords.longitude
        }, (msg)=>{
            locationButton.removeAttribute('disabled')
            console.log(msg)
        })
    })
})

socket.emit('join', {username, room}, (error)=>{
    if(error){
        alert(error)
        location.href = '/'
    }
})