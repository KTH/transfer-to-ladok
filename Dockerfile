# This Dockerfile uses multi-stage builds as recommended in
# https://github.com/nodejs/docker-node/blob/master/docs/BestPractices.md
#

#
# First, we build the frontend in /usr/src/app/t2l-frontend
FROM node:20 AS frontend
WORKDIR /root
# Install dependencies
# 1. Copy only package.json so dependencies can be cached
# 2. Move to /packages/t2l-frontend before running npm ci
COPY ["package.json", "package.json"]
COPY ["package-lock.json", "package-lock.json"]
COPY ["packages/t2l-frontend/package.json", "packages/t2l-frontend/package.json"]
WORKDIR /root/packages/t2l-frontend
RUN npm ci --unsafe-perm

WORKDIR /root
COPY . .

WORKDIR /root/packages/t2l-frontend
RUN npm run build

#
# Second, we install backend dependencies
FROM node:20 AS backend
WORKDIR /root
COPY ["package.json", "package.json"]
COPY ["package-lock.json", "package-lock.json"]
COPY ["packages/t2l-backend/package.json", "packages/t2l-backend/package.json"]
WORKDIR /root/packages/t2l-backend
RUN npm ci --omit=dev --unsafe-perm

#
# Third, build the production image with a minimal node (alpine)
FROM node:20-alpine AS production
WORKDIR /root
COPY --from=backend /root/node_modules node_modules
COPY --from=frontend /root/packages/t2l-frontend/dist packages/t2l-frontend/dist
COPY --from=backend /root/packages/t2l-backend/node_modules packages/t2l-backend/node_modules
COPY . .

EXPOSE 3000
WORKDIR /root/packages/t2l-backend
CMD npm start
