# Rink Lambda 

*AWS Lambda webhook processor for HockeyApp Feedback calls*

This project provides a basic Webhook processor for HockeyApp Feedback callbacks.
It's intended to run in AWS Lambda, but could also be a good reference for other
environments.

Included in the logic are a few little details that were a bit of work to sort out,
such as how to obtain the screenshot image. Hopefully this will save you some time
with your own requirements.

The Jira ticket will be created with the screen shot, some details about the user
(if you have configured your app to send them to Hockey), and a Web link to the
original feedback item.

## JIRA Access

If you intend to use the project as-is, you need to generate security certificates
to authenticate the Webhook to your Jira instance (which must be publicly reachable).
Do the following:

1. Create an RSA key for authenticating the requests:

        openssl genrsa -out jira.pem 1024
        openssl rsa -in jira.pem -pubout -out jira.pub

2. Follow [this guide](https://www.prodpad.com/2013/05/tech-tutorial-oauth-in-jira/) to create an application link in Jira.
3. Edit `getAuthToken.js` to adjust the parameters there, then run `node getAuthToken.js`.
3. This will output a URL. Open the URL in a browser and follow the instructions there.
4. Take note of the tokens/verifiers this logs out. Edit `getAccessToken.js` and paste those values into that file.
5. Edit index.js and adjust the settings there as well.

Pull requests welcome from anybody who wants to streamline this process, move things
to config files, etc. This was a one-and-done project for me so it wasn't worth the
extra steps.
