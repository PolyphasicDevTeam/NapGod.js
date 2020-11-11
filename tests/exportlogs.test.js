const DiscordStub = require('./discordStub.js');
const dbHandler = require('./db-handler');
const rewire = require('rewire');
const LogModel = require('../server/models/log.model.js');

const { testTables } = require('../server/commands/exportlogs.command.js');
const { exportJson } = testTables;

const target = rewire('../server/commands/exportlogs.command.js');

async function exportNoPerm() {
    let message = new DiscordStub.Message("author", ["Role1", "Role2"], "content");
    await exportJson(message);

    return message.channel.mockSend.mock;
}

async function exportPerm() {
    let message = new DiscordStub.Message("author", ["Moderator"], "content");
    await exportJson(message);

    return message.channel.mockSend.mock;
}

beforeAll(async () => await dbHandler.connect());
afterEach(async () => await dbHandler.clearDatabase());
afterAll(async () => await dbHandler.closeDatabase());

let res;

describe('Export Logs', () => {

        it('should return no permission error message', async () => {
            res = await exportNoPerm();
            expect(res.calls[0][0]).toBe(target.__get__('noPermission'));
        });

        it('should return logs location message', async () => {
            res = await exportPerm();
            expect(res.calls[0][0]).toBe(`Logs are available at ${target.__get__('cacheUrl')}/export.json`);
        });
});
