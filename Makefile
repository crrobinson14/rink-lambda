delete:
	aws lambda delete-function --region us-east-1 --function-name postHockeyFeedback

get:
	aws lambda get-function --region us-east-1 --function-name postHockeyFeedback

invoke:
	aws lambda invoke-async --region us-east-1 --function-name postHockeyFeedback --invoke-args $(payload)

list:
	aws lambda list-functions --region us-east-1

list-event-sources:
	aws lambda list-event-sources --region us-east-1

package:
	@npm install
	@rm ./postHockeyFeedback.zip
	@zip -r ./postHockeyFeedback.zip * -x *.json *.zip test.js .gitignore .idea *.md

update: package
	aws lambda update-function-code --region us-east-1 --function-name postHockeyFeedback \
	    --zip-file fileb://postHockeyFeedback.zip

.PROXY: delete get invoke list list-event-sources update upload test
