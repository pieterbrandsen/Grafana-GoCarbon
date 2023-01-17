/* Setup:
     Step 1: Remove all users below
     Step 2: Add users like this:
          A. MMO:
          {
               username: 'PandaMaster',
               type: 'mmo',
               shards: ['shard0'],
               token: 'TOKEN_FOR_THIS_USER!',
          },
          B. Private:
          {
               username: 'W1N1',
               type: 'private',
               shards: ['screeps'],
               password: 'password',
          },
    Step 3: Add the host of the private server if its not localhost
          {
              username: 'W1N1',
              type: 'private',
              shards: ['screeps'],
              password: 'password',
              host: '123.456.789',
          },
     Step 4: Add the segment of the stats if its not memory
          {
              username: 'W1N1',
              type: 'private',
              shards: ['screeps'],
              password: 'password',
              host: '123.456.789',
              segment: 0,
          },
*/

export default [
  {
    username: 'W1N1',
    type: 'private',
    shards: ['screeps'],
    password: 'password',
  },
  {
    username: 'W6N1',
    type: 'private',
    shards: ['screeps'],
    password: 'password',
  },
  {
    username: 'W2N5',
    type: 'private',
    shards: ['screeps'],
    password: 'password',
  },
  {
    username: 'W5N8',
    type: 'private',
    shards: ['screeps'],
    password: 'password',
  },
  {
    username: 'W7N3',
    type: 'private',
    shards: ['screeps'],
    password: 'password',
  },
  {
    username: 'W9N9',
    type: 'private',
    shards: ['screeps'],
    password: 'password',
  },
  {
    username: 'W3N9',
    type: 'private',
    shards: ['screeps'],
    password: 'password',
  },
  {
    username: 'W8N6',
    type: 'private',
    shards: ['screeps'],
    password: 'password',
  },
  {
    username: 'W3N3',
    type: 'private',
    shards: ['screeps'],
    password: 'password',
  },
];
