# Storefront image: builds the React app, then serves the static files
# with nginx. REACT_APP_* values are baked in at build time:
#   docker build \
#     --build-arg REACT_APP_API_URL=https://api.yourshop.com/api \
#     --build-arg REACT_APP_STRIPE_PUBLIC_KEY=pk_live_... .
FROM node:22-alpine AS build

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
ARG REACT_APP_API_URL
ARG REACT_APP_STRIPE_PUBLIC_KEY
ENV REACT_APP_API_URL=$REACT_APP_API_URL \
    REACT_APP_STRIPE_PUBLIC_KEY=$REACT_APP_STRIPE_PUBLIC_KEY
RUN npm run build

FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
