# LDAP Bridge for REC0-Bot

## What is this?
A bridge plugin that synchronize users info with LDAP server and notify them to other plugins. 

## How to build
Run `npm i && npm run build` to build.  
If you want to clean up built files, run `npm run clean`.

## Environment variables
`REC0_ENV_LDAP_BRIDGE_PROTO` : Protocol name for LDAP connection.   
`REC0_ENV_LDAP_BRIDGE_HOST` : Host name of LDAP server.
`REC0_ENV_LDAP_BRIDGE_PORT` : Port number of LDAP server. 
`REC0_ENV_LDAP_BRIDGE_USERDN` : DN of binding user.  
`REC0_ENV_LDAP_BRIDGE_PASSWORD` : Password of Binding user.  
`REC0_ENV_LDAP_BRIDGE_CLIENT_CERT_PATH` : Path for custom certificate which will be used on TLS.     
`REC0_ENV_LDAP_BRIDGE_SEARCH_BASEDN` : Base DN on search.  
`REC0_ENV_LDAP_BRIDGE_SEARCH_FILTER` : Search filter which uses for gathering users info.   
`REC0_ENV_LDAP_BRIDGE_NOTIFY_TARGETS` : Plugin names that notify users info to. You can specify multiple names with comma-separated.

## Author
clvs7 (Arisaka Mashiro)

## License
Apache License 2.0
