FROM nginx:alpine
COPY apps/gateway/nginx.conf       /etc/nginx/nginx.conf
COPY apps/gateway/cors.conf        /etc/nginx/cors.conf
COPY apps/gateway/security.conf    /etc/nginx/security.conf
COPY apps/gateway/security-web.conf /etc/nginx/security-web.conf
COPY openapi.json                  /etc/nginx/openapi.json
