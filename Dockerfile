FROM node:24-bookworm-slim AS frontend-build
WORKDIR /src/frontend

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS backend-build
WORKDIR /src

COPY backend/ ./backend/
RUN dotnet restore backend/src/YouTubeClone.Api/YouTubeClone.Api.csproj
RUN dotnet publish backend/src/YouTubeClone.Api/YouTubeClone.Api.csproj \
    -c Release \
    -o /app/publish \
    /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends ffmpeg \
    && rm -rf /var/lib/apt/lists/*

COPY --from=backend-build /app/publish ./
COPY --from=frontend-build /src/frontend/dist ./wwwroot
COPY backend/Storage/media ./seed-media
COPY deploy/entrypoint.sh ./entrypoint.sh

RUN chmod +x /app/entrypoint.sh

ENV ASPNETCORE_ENVIRONMENT=Production
ENV Storage__RootPath=/data/media
ENV HOME=/data

EXPOSE 8080

ENTRYPOINT ["/app/entrypoint.sh"]
