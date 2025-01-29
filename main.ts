import { serveDirWithTs } from 'jsr:@ayame113/ts-serve';

Deno.serve((request) =>
  serveDirWithTs(request, {
    fsRoot: './public',
    showIndex: true,
  })
);
