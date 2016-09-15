var JiraClient = require('jira-connector'),
    fs = require('fs');

JiraClient.oauth_util.getAuthorizeURL({
    host: 'YOURAPPNAME.atlassian.net',
    oauth: {
        private_key: fs.readFileSync('./jira.pem', 'utf8'),
        consumer_key: 'YOURCONSUMERKEY'
    }
}, function(error, oauth) {
    console.log(error);
    console.log(oauth);
});
