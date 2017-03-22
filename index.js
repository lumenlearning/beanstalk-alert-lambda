var https = require('https');
var util = require('util');

var SLACK_HOOK_PATH = process.env.SLACK_HOOK_PATH; // Everything from the URL beginning with "/" after the hostname
var SLACK_CHANNEL = process.env.SLACK_CHANNEL; // "#ops-alerts"
var BEANSTALK_ENV = process.env.BEANSTALK_ENV; // "Production", "Staging", etc

var IGNORE_MESSAGES = [
    "OK to Info",
    "Info to OK"
];

var WARNING_MESSAGES = [
    " aborted operation.",
    " to YELLOW",
    "Adding instance ",
    "Degraded to Info",
    "Deleting SNS topic",
    "is currently running under desired capacity",
    "Ok to Info",
    "Ok to Warning",
    "Pending Initialization",
    "Removed instance ",
    "Rollback of environment"
];

var DANGER_MESSAGES = [
    " but with errors",
    " to Degraded",
    " to RED",
    " to Severe",
    "During an aborted deployment",
    "Failed to deploy application",
    "Failed to deploy configuration",
    "has a dependent object",
    "is not authorized to perform",
    "Pending to Degraded",
    "Stack deletion failed",
    "Unsuccessful command execution",
    "You do not have permission",
    "Your quota allows for 0 more running instance",
    "requests to the ELB are failing",
    
];

exports.handler = function(event, context) {
    //    console.log(JSON.stringify(event, null, 2));
    //    console.log('From SNS:', event.Records[0].Sns.Message);

    var awsMessageRaw = event.Records[0].Sns.Message;
    var awsMessageData = awsMessageToMap(awsMessageRaw);

    var applicationName = prettyApplicationName(awsMessageData['Application']);

    var slackUsername = util.format('AWS %s - %s', BEANSTALK_ENV, applicationName);
    var slackMessageDetails = createSlackMessageDetails(awsMessageData);

    var messageType = getMessageType(awsMessageRaw);
    var slackMessagePrefix = messageType ? '*' + messageType + '*: ' : '*'
    var slackMessage = slackMessagePrefix + awsMessageData['Message'];

    var postData = {
        "channel": SLACK_CHANNEL,
        "username": slackUsername,
        "text": slackMessage,
        "icon_emoji": ":beanstalk:"
    };

    var severity = "good";

    // Don't spam Slack with unnecessary notices
    for (var ignoreMessage in IGNORE_MESSAGES) {
        if (awsMessageRaw.indexOf(IGNORE_MESSAGES[ignoreMessage]) != -1) {
            console.log("Ignoring informational Beanstalk message.")
            context.done(null);
            return;
        }
    }

    for (var dangerMessage in DANGER_MESSAGES) {
        if (awsMessageRaw.indexOf(DANGER_MESSAGES[dangerMessage]) != -1) {
            severity = "danger";
            break;
        }
    }

    // Only check for warning messages if necessary
    if (severity == "good") {
        for (var warningMessage in WARNING_MESSAGES) {
            if (awsMessageRaw.indexOf(WARNING_MESSAGES[warningMessage]) != -1) {
                severity = "warning";
                break;
            }
        }
    }

    postData.attachments = [{
        "color": severity,
        "text": slackMessageDetails
    }];

    var options = {
        method: 'POST',
        hostname: 'hooks.slack.com',
        port: 443,
        path: SLACK_HOOK_PATH
    };

    var req = https.request(options, function(res) {
        res.setEncoding('utf8');
        res.on('data', function(chunk) {
            context.done(null);
        });
    });

    req.on('error', function(e) {
        console.log('HTTP request failed: ' + e.message);
    });

    req.write(util.format("%j", postData));
    req.end();
};

function awsMessageToMap(awsMessageRaw) {
    var data = {};

    awsMessageRaw.split(/\r?\n/).forEach(function(item) {
        var delimIndex = item.indexOf(':');

        if (-1 == delimIndex) {
            return;
        }

        var key = item.substring(0, delimIndex);
        var value = item.substring(delimIndex + 2);

        data[key] = value;
    });

    return data;
}

function createSlackMessageDetails(data) {
    var slackMessageDetails = util.format('Environment: %s\nTimestamp: %s', data['Environment'],
        data['Timestamp']);

    return slackMessageDetails;
}

function getMessageType(awsMessageRaw) {
    var messageLower = awsMessageRaw.toLowerCase();

    if (messageLower.indexOf('deploy') != -1) {
        return 'Deployment';
    } else if (messageLower.indexOf('rollback') != -1) {
        return 'Rollback';
    } else if (messageLower.indexOf('environment health has transitioned from') != -1) {
        return 'Health';
    }

    return null;
}

function prettyApplicationName(applicationName) {
    var nameLower = applicationName.toLowerCase();

    if (nameLower.indexOf('goldilocks') != -1) {
        return 'Goldilocks';
    } else if (nameLower.indexOf('myopenmath') != -1) {
        return 'MyOpenMath';
    } else if (nameLower.indexOf('openassessments') != -1) {
        return 'OpenAssessments';
    } else {
        return applicationName;
    }
}

