var JiraClient = require('jira-connector'),
    fs = require('fs'),
    Promise = require('bluebird'),
    request = require('request'),
    jiraUrl = 'YOURAPPNAME.atlassian.net',
    consumerKey = 'YOURCONSUMERKEY',
    authToken = 'YOURAUTHTOKEN',
    authSecret = 'YOURAUTHSECRET',
    projectKey = 'YOURJIRAPROJECTKEY',
    issueTypeName = 'JIRAISSUETYPENAME',
    hockeyToken = 'YOURHOCKEYAPPTOKEN';

// Lambda callback handler.
exports.handler = function(event, context) {
    // Make sure this is a valid request.
    var message = (event.type === 'feedback' && typeof event.feedback === 'object')
        ? event.feedback.messages.pop()
        : null;

    if (!message) {
        console.log('Invalid or unexpected call', event);
        return;
    }

    console.log('Processing feedback message', message);

    var jira = new JiraClient({
            host: jiraUrl,
            oauth: {
                private_key: fs.readFileSync('./jira.pem', 'utf8'),
                consumer_key: consumerKey,
                token: authToken,
                token_secret: authSecret
            }
        }),
        issue,
        feedbackId = event.feedback.id,
        appId = message.app_id,
        processedAttachments = [];

    // First download any/all attachments.
    Promise.map(message.attachments, function(attachment) {
        var url = 'https://rink.hockeyapp.net/api/2/apps/' + appId + '/feedback/' + feedbackId +
            '/feedback_attachments/' + attachment.id;

        console.log('Downloading attachment', url);
        return imageFromUrl(url).then(function(result) {
            if (result) {
                console.log('Downloaded attachment', result.statusCode, result.body.length);
                processedAttachments.push({
                    filename: attachment.file_name,
                    data: result.body
                });
            }
        });

    }).then(function() {
        // Now create the issue itself
        var subject = message.name + ': ' + message.subject,
            description = [
                'Feedback from ' + message.name + ' (' + event.feedback.email + ')',
                'Device: ' + message.oem + ' ' + message.model + ' ' + message.os_version,
                'App ID: ' + appId,
                'Feedback ID: ' + feedbackId,
                'Message ID: ' + message.id,
                '',
                message.text
            ].join('\n');

        // NOTE: This library doesn't promisify very well... Something to research at some point?
        return new Promise(function(resolve, reject) {
            jira.issue.createIssue({
                fields: {
                    project: { key: projectKey },
                    summary: subject,
                    description: description,
                    issuetype: {
                        name: issueTypeName
                    }
                }
            }, function(err, result) {
                err ? reject(err) : resolve(result);
            });
        });

    }).then(function(result) {
        issue = result;
        console.log('Created issue', issue);

        return new Promise(function(resolve, reject) {
            jira.issue.createRemoteLink({
                issueKey: issue.key,
                remoteLink: {
                    object: {
                        url: event.url + '#message' + message.id,
                        title: 'Hockey Link'
                    }
                }
            }, function(err, result) {
                err ? reject(err) : resolve(result);
            });
        });

    }).then(function(result) {
        console.log('Created remote link', result);

        // Then add any attachments
        return Promise.map(processedAttachments, function(attachment) {
            return addAttachment(issue.key, attachment.filename, attachment.data);
        });

    }).catch(function(e) {
        console.log('Error creating issue', e);

    });

    // The Issue.addAttachment function only supports reading from the filesystem - this is a copy/hack to handle in-memory files.
    function addAttachment(issueKey, filename, content) {
        console.log('Adding attachment ' + filename + ' to ' + issueKey + ': ' + content.length + ' bytes');
        return new Promise(function(resolve, reject) {
            var r = request.post({
                uri: 'https://' + jiraUrl + '/rest/api/2/issue/' + issueKey + '/attachments',
                oauth: jira.oauthConfig,
                followAllRedirects: true,
                headers: {
                    'X-Atlassian-Token': 'nocheck'
                }
            }, function(err, response, body) {
                if (err || response.statusCode >= 300) {
                    console.log('Error adding attachment', err, (response || {}).statusCode);
                    reject(err || response.statusCode);
                }

                resolve(body);
            });

            var form = r.form();
            form.append('file', content, { filename: filename });
        });
    }
};

function imageFromUrl(url) {
    return new Promise(function(resolve, reject) {
        request({
            url: url,
            encoding: null, // Returns result as a Buffer
            timeout: 5000,
            headers: {
                'X-HockeyAppToken': hockeyToken
            }
        }, function(err, response, body) {
            // TODO: We have a bunch of cases where we have trouble downloading the image but we don't want
            // to stop processing here because we may not get another chance. So on any error, we just skip
            // the attachment and the user can view it by following the link.
            //
            // Not perfect but all we had time for today...

            if ((response || {}).statusCode >= 300) {
                console.log('imageFromUrl: Unexpected status: ' + response.statusCode);
                return resolve(null);
            }

            if (err || !response) {
                console.log('imageFromUrl error', err);
                return resolve(null);
            }

            resolve({
                body: body,
                statusCode: response.statusCode
            });
        });
    });
}
