FROM nginx:alpine
COPY apps/gateway/nginx.conf.template /etc/nginx/nginx.conf.template
COPY apps/gateway/cors.conf         /etc/nginx/cors.conf
COPY apps/gateway/security.conf     /etc/nginx/security.conf
COPY apps/gateway/security-web.conf /etc/nginx/security-web.conf
COPY apps/gateway/auth.conf         /etc/nginx/auth.conf
COPY openapi.json                   /etc/nginx/openapi.json

CMD ["/bin/sh", "-c", "envsubst < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf && nginx -g 'daemon off;'"]
