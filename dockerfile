FROM denoland/deno:2.1.10

# The port that your application listens to.
EXPOSE 3000

WORKDIR /app


# Cache the dependencies as a layer (the following two steps are re-run only when deps.ts is modified).
# Ideally cache deps.ts will download and compile _all_ external files used in main.ts.
COPY main.ts .
RUN deno install --entrypoint main.ts

# These steps will be re-run upon each file change in your working directory:
COPY . .
# Compile the main app so that it doesn't need to be compiled each startup/entry.
RUN deno cache main.ts

# make empty directory called .cache
RUN mkdir .cache

CMD ["run", "-A", "main.ts"]

