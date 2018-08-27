FROM node:8
COPY src/ /node/
WORKDIR /node
ENTRYPOINT ["node", "/node/server.js"]
