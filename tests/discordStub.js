//const Discord = require('Discord.js');

class Channel {
    mockSend = jest.fn();

    async send(content) {
        this.mockSend(content);
        return new Message("Returned message author", [], content, this);
    }
}

class Role {
    name;

    constructor(name) {
        this.name = name;
    }
}

class Member {
    name;
    roles;

    constructor(name, roles) {
        this.name = name;
        this.roles = roles.map(name => { return new Role(name) });
    }
}

class Message {
    author;
    channel;
    content;
    member;

    constructor(author, roles, content, channel = new Channel()) {
        this.author = author;
        this.member = new Member(author, roles);
        this.channel = channel;
        this.content = content;
    }
}

module.exports = {
    Channel,
    Message
}
