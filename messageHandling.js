const onlineUsers = [];

const handleMessage = (data) => {
    const {type, message, name, id} = JSON.parse(data);
    switch (type + '_' + message) {
        case 'connection_joined':
            onlineUsers.push({id, name});
            break;
        case 'connection_left':
            const i = onlineUsers.findIndex((user) => user.id === id);
            onlineUsers.splice(i, 1);
            break;
        default:
            console.log(data);
    }
    return JSON.stringify({id: 'service', type, onlineUsers});
};

exports.handleMessage = handleMessage;