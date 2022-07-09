FROM node:16-alpine as base
LABEL org.opencontainers.image.source=https://github.com/Mineaurion/AurionStaff
WORKDIR /usr/src/app
RUN adduser --disabled-password --home /home/container container && \
  chown -R container:container /usr/src/app
USER container
# Only usefull for pterodactyl panel
ENV USER=container HOME=/home/container
COPY --chown=container:container package*.json ./

FROM base as dependencies
RUN npm ci

FROM dependencies as build
COPY . .
RUN npm run build

FROM dependencies as dev
ENV NODE_ENV development
COPY . .
RUN npm ci
CMD [ "npm", "run", "start:dev" ]

FROM dependencies as prod
ENV NODE_ENV production
COPY --from=build --chown=container:container /usr/src/app/build ./build
RUN npm ci && rm -R ~/.npm
CMD [ "npm", "run", "start:prod" ]