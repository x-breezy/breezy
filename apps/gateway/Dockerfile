FROM nginx:alpine
COPY apps/gateway/nginx.conf.template /etc/nginx/nginx.conf.template
COPY apps/gateway/cors.conf         /etc/nginx/cors.conf
COPY apps/gateway/security.conf     /etc/nginx/security.conf
COPY apps/gateway/security-web.conf /etc/nginx/security-web.conf
COPY apps/gateway/auth.conf         /etc/nginx/auth.conf
COPY openapi.json                   /etc/nginx/openapi.json

CMD ["/bin/sh", "-c", "envsubst '${AUTH_UPSTREAM} ${PROFILE_UPSTREAM} ${POST_UPSTREAM} ${MEDIA_UPSTREAM} ${NOTIFICATIONS_UPSTREAM} ${MESSAGE_UPSTREAM} ${WEB_UPSTREAM} ${SWAGGER_UPSTREAM} ${KIBANA_UPSTREAM} ${RABBITMQ_UPSTREAM} ${CORS_ORIGIN_1} ${CORS_ORIGIN_2} ${LOGS_DOMAIN} ${MQ_DOMAIN} ${JAEGER_UPSTREAM} ${TRACING_DOMAIN}' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf && nginx -g 'daemon off;'"]
