# Puru DICOM Viewer - based on OHIF Viewers v3.12.0
# Multi-stage build: node (bun) → nginx
#


# Stage 1: Build the application
# docker build -t ohif/viewer:latest .
# Copy Files
FROM node:20.18.1-slim as builder

RUN apt-get update && apt-get install -y build-essential python3


RUN mkdir /usr/src/app
WORKDIR /usr/src/app
RUN npm install -g bun@1.2.23
RUN npm install -g lerna@7.4.2
ENV PATH=/usr/src/app/node_modules/.bin:$PATH

# Copy everything for install and build
COPY . .

RUN bun pm cache rm
RUN bun install --no-frozen-lockfile
RUN bun add ajv@8.12.0 --no-frozen-lockfile

# Build here
# After install it should hopefully be stable until the local directory changes
ENV QUICK_BUILD true
# ENV GENERATE_SOURCEMAP=false
ARG APP_CONFIG=config/default.js
ARG PUBLIC_URL=/
ENV PUBLIC_URL=${PUBLIC_URL}

RUN bun run show:config
RUN bun run build

# Precompress files
RUN chmod u+x .docker/compressDist.sh
RUN ./.docker/compressDist.sh

# Stage 3: Bundle the built application into a Docker container
# which runs Nginx using Alpine Linux
FROM nginxinc/nginx-unprivileged:1.27-alpine as final
#RUN apk add --no-cache bash
ARG PUBLIC_URL=/
ENV PUBLIC_URL=${PUBLIC_URL}
ARG PORT=80
ENV PORT=${PORT}
RUN rm /etc/nginx/conf.d/default.conf
USER nginx
COPY --chown=nginx:nginx .docker/Viewer-v3.x /usr/src
RUN chmod 777 /usr/src/entrypoint.sh
COPY --from=builder /usr/src/app/platform/app/dist /usr/share/nginx/html${PUBLIC_URL}
# Copy paths that are renamed/redirected generally
# Microscopy libraries depend on root level include, so must be copied
COPY --from=builder /usr/src/app/platform/app/dist/dicom-microscopy-viewer /usr/share/nginx/html/dicom-microscopy-viewer

# In entrypoint.sh, app-config.js might be overwritten, so chmod it to be writeable.
# The nginx user cannot chmod it, so change to root.
USER root
RUN chown -R nginx:nginx /usr/share/nginx/html && chmod -R 777 /usr/share/nginx/html
USER nginx
ENTRYPOINT ["/usr/src/entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
