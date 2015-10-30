# [Basic Chat](http://fidd.io:5555)
[![Dependency Status](https://david-dm.org/kamronbatman/basic-chat.svg)](https://david-dm.org/kamronbatman/basic-chat.svg)
[![devDependency Status](https://david-dm.org/kamronbatman/basic-chat/dev-status.svg)](https://david-dm.org/kamronbatman/basic-chat/dev-status.svg)<br>

> A basic telnet chat server using Node.js

## Table of Contents

1. [Usage](#usage)
1. [Requirements](#requirements)
1. [Installation](#Installation)
    1. [Environment Configuration File](#environment-configuration-file)
    1. [Deployment](#deployment)

## Usage

> Connect to the server using telnet. A demo is set up at fidd.io on port 5555.

## Requirements

### Backend
- [Node.js](https://nodejs.org/)

### Utilities
- [Grunt](http://gruntjs.com/)
- [npm](https://www.npmjs.com/)

## Installation

### Environment Configuration File

In the root of the project, add a file called `.env` with the following:
```
NODE_ENV    = 'development'
telnetPort  = 5555
```

In the .env file, change NODE_ENV to `production` for deployment on a production server.

### Deployment

With [Grunt](http://gruntjs.com/getting-started), and [npm](https://www.npmjs.com/#getting-started) installed globally, install dependencies by running the following commands from the terminal:
```
npm install
grunt
```

`grunt` installs front end dependencies and starts the server. To build the project without starting the server, run `grunt build` instead of `grunt`.

To stop the server from running in the background in production mode, run `grunt stop`.
