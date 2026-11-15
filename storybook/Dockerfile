# The web app's Storybook as a static site, for its own private Astrolift app
# (storybook/astrolift.toml), composed into the Calliope AI UX front door.
# Builds from the repository root, because the workspace install needs the
# root lockfile:
#
#   docker build -f storybook/Dockerfile -t app-storybook .
#   docker run --rm -p 8080:8080 app-storybook

# Build: the workspace install, then apps/web's Storybook build.
FROM node:24-alpine AS build
WORKDIR /app
COPY . .
RUN npm ci --workspace apps/web --include-workspace-root
RUN npm run build-storybook --workspace apps/web

# Serve: static files only, nginx as an unprivileged user on 8080.
FROM nginx:1.29-alpine
COPY storybook/nginx.conf /etc/nginx/nginx.conf
COPY --from=build /app/apps/web/storybook-static /usr/share/nginx/html
USER 101:101
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s CMD wget -q -O /dev/null http://127.0.0.1:8080/healthz || exit 1
