FROM node:18-slim

# install dependencies
COPY . .
RUN npm install
RUN cd server ; npm install ; cd ..
RUN cd page ; npm install ; cd ..

# build application
RUN npm run build

WORKDIR server
CMD [ "node", "built/server/index.js" ]