FROM denoland/deno:alpine-1.35.1
WORKDIR /app
COPY . .
EXPOSE 8000
CMD ["run", "--allow-all", "main.ts"]
