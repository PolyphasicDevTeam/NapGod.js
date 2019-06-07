# Docker usage

Copy 'config.json.sample' to 'config.json' and configure the file appropriately. For purposes of the example setup, this file is placed in the home directory.

For the token, create a discord test bot and copy the token (see section on creating a bot).

## To use without docker-compose

`mkdir ~/mongo_data` <- place wherever appropriate

`mkdir ~/cache` <- folder from which the webserver serves cached objects

`sudo docker network create ng_network`

`sudo docker run --name ng_mongo --log-opt max-size=10m --memory=768m --restart always --net ng_network -v $HOME/mongo_data:/data/db -d mongo --storageEngine wiredTiger`

`sudo docker run --net ng_network -v $HOME/cache:/napcharts -v $HOME/config.json:/usr/src/napgodjs-build/config.json --log-opt max-size=10m --restart always -dit --name ng polyphasic/napgod_js`

## To use docker-compose
In `config.json`, set mongo to `"mongodb://database:27017/napgod"`
Install docker-compose `brew install docker-compose` if you're on a Mac and have Homebrew installed
Run `npm install` (because of the way docker-compose uses volumes to copy code from your computer to the container, you need to do an npm install before running docker-compose)
Run `docker-compose up`

# Creating your own instance of the NapGod bot for testing
- Create your own private server for testing your private NapGod.
  - If you have `modonly` set to true in your `config.json` make sure to create an Admins role and give it to yourself
- Create an application and bot on discord (https://discordapp.com/developers/applications/).
  - Set Public Bot and Requires OAuth2 Code Grant to false
- In the OAuth2 tab, click the 'bot' scope and choose the permission you need.
- Then copy that link into your browser to invite your new bot to your server.

# the-static-one-data

Edit any of the .md files.  To help improve/format text.

## Guide for those new to github

* Make an account and log in
* Open the file you want to edit
* Click the pencil in the top left
* Make the changes you want
* Click Preview to make sure it looks right
* Add a short description at the bottom of the page
* Click commit

### NOTE

We're using markdown files. 

Syntax guide found here : https://guides.github.com/features/mastering-markdown/

## Adding new commands

* To add new commands just make a new .md file.
* The name of the file will be the name of the command that follows the +
   * IE - GARBLE.md will result in +garble showing the contents of GARBLE.md on the server.
   
   
## Continuous Delivery

There is continuous delivery set up so everything that's pushed to the git repo gets built by Docker Hub and subsequently pulled by watchtower container and deployed.