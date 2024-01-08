import fs from "fs";

export class DataManager {
  constructor() {
    this.users = this.loadFile("users");
    this.groups = this.loadFile("groups");
    this.events = this.loadFile("events");
  }

  loadFile(kind) {
    let data = fs.readFileSync(`./data/${kind}.json`);
    return JSON.parse(data);
  }

  saveToFile(kind) {
    return new Promise((resolve, reject) => {
      fs.writeFile(
        `./data/${kind}.json`,
        JSON.stringify(this[kind], null, 2),
        (err) => {
          if (err) {
            console.log(`failed to write ${kind}`);
            reject();
          }
          console.log(`successfully saved ${kind}`);
          resolve();
        },
      );
    });
  }

  saveEvents() {
    return this.saveToFile("events");
  }
  saveUsers() {
    return this.saveToFile("users");
  }
  saveGroups() {
    return this.saveToFile("groups");
  }

  async save() {
    return Promise.all([
      this.saveEvents(),
      this.saveGroups(),
      this.saveUsers(),
    ]);
  }

  getUsers(chatID) {
    return this.groups[chatID];
  }

  getUserIDs(chatID) {
    let users = this.groups[chatID];
    if (!users) return [];
    let userIDs = [];
    for (let userName of users) {
      userIDs.push(this.users[userName]);
    }
    return userIDs;
  }

  getUserID(username) {
    return this.users[username];
  }

  getUsername(userID) {
    for (let user in this.users) {
      if (this.users[user] === userID) {
        return user;
      }
    }
    return "not found";
  }

  async setUser(username, userID) {
    this.users[username] = userID;
    await this.saveUsers();
  }

  async setUsers(users) {
    for (user in users) {
      const { username, userID } = user;
      this.users[username] = userID;
    }
    await this.saveUsers();
  }

  async removeUser(username) {
    delete this.users[username];
    await this.saveUsers();
  }

  async setGroup(chatID, users) {
    this.groups[`${chatID}`] = users;
    await this.saveGroups();
  }

  async deleteGroup(chatID) {
    if (!this.groups[`${chatID}`]) {
      return false;
    }
    delete this.groups[`${chatID}`];
    await this.saveGroups();
    return true;
  }

  async setEvent(chatID, msg, summary, messageID, confirmed) {
    this.events[`${chatID}`] = {
      msg,
      summary,
      messageID,
    };
    if (confirmed) {
      this.events[`${chatID}`].confirmed = true;
    }
    await this.saveEvents();
  }

  async removeEvent(chatID) {
    if (!this.events[`${chatID}`]) {
      return false;
    }
    delete this.events[`${chatID}`];
    await this.saveEvents();
    return true;
  }

  getEvent(chatID) {
    return this.events[`${chatID}`];
  }

  listEvents() {
    var events = [];
    for (let e in this.events) {
      const event = { ...this.events[e] };
      event.chatID = parseInt(e);
      events.push(event);
    }
    return events;
  }

  listGroups() {
    var groups = [];
    for (let e in this.groups) {
      const group = {};
      group.chatID = parseInt(e);
      group.users = this.groups[e];
      groups.push(group);
    }
    return groups;
  }
}
