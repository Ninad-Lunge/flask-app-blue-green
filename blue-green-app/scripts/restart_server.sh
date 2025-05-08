#!/bin/bash
cd /home/ec2-user/app
npm install
pm2 delete all || true
pm2 start app.js