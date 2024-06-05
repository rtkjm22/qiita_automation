function myFunction() {
  getSlackMessages()
}

// Slack APIのトークン
const SLACK_TOKEN = getVal("SLACK_TOKEN");
// SlackチャンネルID
const SLACK_CHANNEL_ID = getVal("SLACK_CHANNEL_ID");
// Slack APIのエンドポイント
const SLACK_API_ENDPOINT = "https://slack.com/api/conversations.history";
// Qiita.comのリンクの正規表現
const QIITA_LINK_REGEX = /https?:\/\/qiita\.com\/\w+\/items\/\w+/g;

// Slackからメッセージを取得する関数
function getSlackMessages() {
  const headers = { 
    'Authorization': 'Bearer ' + SLACK_TOKEN 
  }
  const options = {
      "method" : "post",
      'contentType': 'application/json; charset=utf-8',
      "headers": headers
  }
  const requestUrl = SLACK_API_ENDPOINT + "?channel=" + SLACK_CHANNEL_ID + "&pretty=1&oldest=" + timestamp()
  const response = UrlFetchApp.fetch(requestUrl, options);
  const data = JSON.parse(response.getContentText());
  const messages = data.messages;
  
  messages.forEach((message) => {
    const text = message.text;
    const links = text.match(QIITA_LINK_REGEX);
    
    if (links) {
      links.forEach(function(link) {
        // pressHeart(link);
      })
    }
  })
}
function getVal(e) {
  return PropertiesService.getScriptProperties().getProperty(e)
}
// 日本時間で今日の開始時刻のUnixタイムスタンプを取得する関数
function timestamp() {
  const now = new Date()
  const timezoneOffset = 9 * 60; // 日本時間はUTC+9
  now.setMinutes(now.getMinutes() + now.getTimezoneOffset() + timezoneOffset);
  now.setHours(0, 0, 0, 0);
  return Math.floor(now.getTime() / 1000);
}
// ハートを押下する関数
function pressHeart(link) {
  // Qiitaの記事にアクセスし、ハートを押下する処理を実装する
  // ここでは、具体的な実装は示しません
}
// 定期的にSlackからメッセージを取得するためのトリガーを設定する関数
// https://auto-worker.com/blog/?p=6397
function setTrigger() {
  ScriptApp.newTrigger("getSlackMessages")
           .everyDays(1)
           .atHour(20)
           .create();
}


