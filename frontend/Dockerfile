FROM node:20.11.1-alpine3.19@sha256:c0a3badbd8a0a760de903e00cedbca94588e609299820557e72cba2a53dbaa2c AS builder
WORKDIR '/app'
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx ng build frontend

FROM nginx:mainline-alpine3.18@sha256:6a2f8b28e45c4adea04ec207a251fd4a2df03ddc930f782af51e315ebc76e9a9 AS runtime
EXPOSE 80
COPY --from=builder /app/dist/frontend/browser /usr/share/nginx/html
COPY --from=builder ./deploy-config/nginx.conf /etc/nginx/conf.d/default.conf
