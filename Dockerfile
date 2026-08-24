FROM node:24-alpine AS dependencies

WORKDIR /workspace

COPY CompCube-Client ./CompCube-Client
RUN cd CompCube-Client && npm ci && npm run build

COPY CompCube-Website/package.json CompCube-Website/package-lock.json ./CompCube-Website/
RUN cd CompCube-Website && npm ci


FROM dependencies AS development

COPY CompCube-Website ./CompCube-Website

WORKDIR /workspace/CompCube-Website
ENV NODE_ENV=development

EXPOSE 3000
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "3000"]


FROM dependencies AS build

COPY CompCube-Website ./CompCube-Website
RUN cd CompCube-Website && npm run build


FROM node:24-alpine AS production

WORKDIR /app
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

COPY --from=build /workspace/CompCube-Website/build ./build
COPY --from=dependencies /workspace/CompCube-Website/node_modules ./node_modules
COPY --from=dependencies /workspace/CompCube-Website/package.json ./package.json
COPY --from=dependencies /workspace/CompCube-Client ./CompCube-Client

EXPOSE 3000
CMD ["node", "build"]
