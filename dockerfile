FROM denoland/deno-2.1.10
WORKDIR /app
COPY . .
EXPOSE 8000
CMD ["run", "--allow-all", "main.ts"]
