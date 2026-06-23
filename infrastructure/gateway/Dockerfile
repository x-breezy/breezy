FROM nginx:alpine
COPY infrastructure/gateway/nginx.conf.template /etc/nginx/nginx.conf.template
COPY infrastructure/gateway/cors.conf         /etc/nginx/cors.conf
COPY infrastructure/gateway/security.conf     /etc/nginx/security.conf
COPY infrastructure/gateway/security-web.conf /etc/nginx/security-web.conf
COPY infrastructure/gateway/auth.conf         /etc/nginx/auth.conf
COPY openapi.json                   /etc/nginx/openapi.json

CMD ["/bin/sh", "-c", "envsubst '${AUTH_UPSTREAM} ${PROFILE_UPSTREAM} ${POST_UPSTREAM} ${MEDIA_UPSTREAM} ${NOTIFICATIONS_UPSTREAM} ${MESSAGE_UPSTREAM} ${WEB_UPSTREAM} ${SWAGGER_UPSTREAM} ${RABBITMQ_UPSTREAM} ${CORS_ORIGIN_1} ${CORS_ORIGIN_2} ${MQ_DOMAIN} ${GRAFANA_UPSTREAM} ${GRAFANA_DOMAIN}' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf && nginx -g 'daemon off;'"]
