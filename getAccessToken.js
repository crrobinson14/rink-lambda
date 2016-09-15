var JiraClient = require('jira-connector'),
    fs = require('fs');

console.log('Getting Jira access token...');
JiraClient.oauth_util.swapRequestTokenWithAccessToken({
    host: 'YOURAPPNAME.atlassian.net',
    oauth: {
        private_key: fs.readFileSync('./jira.pem', 'utf8'),
        consumer_key: 'YOURCONSUMERKEY',
        token: 'YOURAUTHTOKEN',
        token_secret: 'AUTHTOKENSECRET',
        oauth_verifier: 'VERIFIER'
    }
}, function(error, accessToken) {
    console.log(error);
    console.log(accessToken);
});
