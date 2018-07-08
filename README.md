# Docker usage

Copy 'config.json.sample' to 'config.json' and configuer the file appropriately. For purposes of the example setup, this file is placed in the home directory.

`mkdir ~/mongo_data` <- place wherever appropriate

`mkdir ~/cache` <- folder from which the webserver serves cached objects

`sudo docker network create ng_network`

`sudo docker run --name ng_mongo --log-opt max-size=10m --memory=768m --restart always --net ng_network -v $HOME/mongo_data:/data/db -d mongo --storageEngine wiredTiger`

`sudo docker run --net ng_network -v $HOME/cache:/napcharts -v $HOME/config.json:/usr/src/napgodjs-build/config.json --log-opt max-size=10m --restart always -dit --name ng polyphasic/napgod_js`


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
   
   
## WHEN

Updates will not be visible until I pull them and add them manually.  You will not see your changes right away.
