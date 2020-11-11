const DiscordStub = require('./discordStub.js');
const dbHandler = require('./db-handler');
const rewire = require('rewire');

const target = rewire('../server/commands/log.dm.js');
//const = target.__get__('');

beforeAll(async () => await dbHandler.connect());
afterEach(async () => await dbHandler.clearDatabase());
afterAll(async () => await dbHandler.closeDatabase());

describe('Log', () => {

        it('should', () => {
        });
});
