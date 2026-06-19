FROM docker.elastic.co/beats/filebeat:8.15.0

USER root
COPY filebeat.yml /usr/share/filebeat/filebeat.yml
RUN chmod go-w /usr/share/filebeat/filebeat.yml

# Keep as root to read log files from shared volume
