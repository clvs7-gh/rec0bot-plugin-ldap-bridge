import { Logger } from '@log4js-node/log4js-api';
import * as fs from 'fs';
import * as ldap from 'ldapjs';
import * as path from 'path';
import { promisify } from 'util';
import { BotProxy } from './bot-proxy.interface';

let mBot: BotProxy;
let logger: Logger;
let metadata: { [key: string]: string };

const ldapContext: { [key: string]: any } = {};
const ldapUsers: { username: string, fullname: string }[] = [];

const syncUsers = async () => {
    // Sync users
    await new Promise(async (resolve, reject) => {
        try {
            const tlsOptions = ldapContext['clientCertPath'] ? {
                ca: [await promisify(fs.readFile)(ldapContext['clientCertPath'], {encoding: 'utf-8'})]
            } : {};

            const client = ldap.createClient({
                url: `${ldapContext['proto']}://${ldapContext['host']}:${ldapContext['port']}}`,
                tlsOptions: tlsOptions
            });
            client.bind(ldapContext['userDN'], ldapContext['secret'], (e) => {
                if (e) {
                    logger.warn('Could not connect to ldap server : ', e);
                    reject(e);
                }
            });
            client.search(ldapContext['searchBaseDN'], {
                filter: ldapContext['searchFilter'],
                scope: 'sub',
                attributes: ['displayName', 'cn']
            }, (e, r) => {
                if (e) {
                    logger.warn('Could not search entry from ldap server : ', e);
                    reject(e);
                    return;
                }
                r.on('error', (_e) => {
                    logger.warn('Could not search entry from ldap server : ', e);
                    reject(_e);
                });
                r.on('searchEntry', (entry) => ldapUsers.push({
                    username: entry.object.samAccountName,
                    fullname: entry.object.displayName
                }));
                r.on('end', (result) => resolve());
            });
        } catch (e) {
            reject(e);
        }
    });
};

const notifyUsers = async () => {
    for ( const t of ldapContext['notifyTargets'] ) {
        await mBot.firePluginEvent(t, 'sync-user', ldapUsers);
    }
};

export const init = async (bot: BotProxy, options: { [key: string]: any }): Promise<void> => {
    mBot = bot;
    logger = options.logger || console;
    metadata = await import(path.resolve(__dirname, 'package.json'));

    logger.info(`${metadata.name} plugin v${metadata.version} has been initialized.`);

    ldapContext['proto'] = (process.env.REC0_ENV_LDAP_BRIDGE_PROTO || 'ldaps').trim();
    ldapContext['host'] = (process.env.REC0_ENV_LDAP_BRIDGE_HOST || 'localhost').trim();
    ldapContext['port'] = Number((process.env.REC0_ENV_LDAP_BRIDGE_PORT || '636').trim());
    ldapContext['userDN'] = (process.env.REC0_ENV_LDAP_BRIDGE_USERDN || '').trim();
    ldapContext['secret'] = (process.env.REC0_ENV_LDAP_BRIDGE_PASSWORD || '').trim();
    ldapContext['clientCertPath'] = (process.env.REC0_ENV_LDAP_BRIDGE_CLIENT_CERT_PATH ||
        path.resolve(__dirname, 'client-cert.pem')).trim();
    ldapContext['searchBaseDN'] = (process.env.REC0_ENV_LDAP_BRIDGE_SEARCH_BASEDN || '').trim();
    ldapContext['searchFilter'] = (process.env.REC0_ENV_LDAP_BRIDGE_SEARCH_FILTER || '').trim();
    ldapContext['notifyTargets'] = (process.env.REC0_ENV_LDAP_BRIDGE_NOTIFY_TARGETS || '')
        .split(',').map((t) => t.trim()).filter((t) => !!t);
};

export const onStart = async () => {
    logger.debug('onStart()');
    // Sync on start
    await syncUsers();
    await notifyUsers();
};

export const onStop = () => {
    logger.debug('onStop()');
};

export const onMessage = (message: string, channelId: string, userId: string, data: { [key: string]: any }) => {
    // Nop
};

export const onPluginEvent = async (eventName: string, value?: any, fromId?: string) => {
    if (eventName === 'scheduled:sync') {
        await syncUsers();
        await notifyUsers();
    }
};
