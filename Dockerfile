FROM node:lts-alpine

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# ES_HOST: Elasticsearch URL — override at runtime, e.g.:
#   docker run -e ES_HOST=http://my-es-host:9200 -p 9100:9100 illume
ENV ES_HOST=http://localhost:9200

RUN npm install -g grunt-cli

COPY package.json /usr/src/app/package.json
RUN npm install --production

COPY . /usr/src/app

# Inject ES_HOST into the app at container start time
CMD sed -i "s|http://localhost:9200|${ES_HOST}|g" /usr/src/app/_site/index.html && \
    grunt server
