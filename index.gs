// 実行関数
function myFunction() {
  const messages = getSlackMessages()
  putStock(messages)
}
// 定期的にSlackからメッセージを取得するためのトリガーを設定
function setTrigger() {
  ScriptApp.newTrigger("myFunction").everyDays(1).atHour(20).create()
}

// Slack APIのトークン
const SLACK_TOKEN = getVal("SLACK_TOKEN")
// SlackチャンネルID
const SLACK_QIITA_CHANNEL_ID = getVal("SLACK_QIITA_CHANNEL_ID")
const SLACK_BOT_CHANNEL_ID = getVal("SLACK_BOT_CHANNEL_ID")
// Slack APIのメッセージ取得用エンドポイント
const SLACK_GET_MESSAGES = "https://slack.com/api/conversations.history"
// Slack APIのメッセージ送信用エンドポイント
const SLACK_POST_MESSAGES = "https://slack.com/api/chat.postMessage"
// Qiita APIのトークン
const QIITA_TOKEN = getVal("QIITA_TOKEN")
// Qiitaのユーザー名
const QIITA_USER_NAME = getVal("QIITA_USER_NAME")
// Qiita.comのリンクの正規表現
const QIITA_LINK_REGEX = /https?:\/\/qiita\.com\/[\w-._~:/?#[\]@!$&'()*+,;=]+\/items\/[\w-._~:/?#[\]@!$&'()*+,;=]+/g
// QiitaのリンクからuserNameとitemIdを抽出する正規表現
const QIITA_EXTRACTION_REGEX = /https:\/\/qiita\.com\/([^\/]+)\/items\/([^\/]+)/

// 任意のチャンネルからメッセージを取得
function getSlackMessages() {
  const options = {
    method: "post",
    contentType: "application/json; charset=utf-8",
    headers: {
      Authorization: "Bearer " + SLACK_TOKEN,
    },
  }
  
  const requestUrl = `${SLACK_GET_MESSAGES}?channel=${SLACK_QIITA_CHANNEL_ID}&pretty=1&oldest=${timestamp()}`
  const response = UrlFetchApp.fetch(requestUrl, options)
  const messages = JSON.parse(response.getContentText()).messages
  const results = []
  messages.map((message) => {
    const text = message.text
    const links = text.match(QIITA_LINK_REGEX)

    links && results.push(links)
  })
  return results
}
// ストックを追加
function putStocks(results) {
  const options = {
    method: "put",
    contentType: "application/json; charset=utf-8",
    headers: {
      Authorization: "Bearer " + QIITA_TOKEN,
    },
  }

  results.map((links) => {
    links.map((item) => {
      const matches = item.match(QIITA_EXTRACTION_REGEX)
      if (!matches || matches[1] === QIITA_USER_NAME) return
      const requestUrl = `https://qiita.com/api/v2/items/${matches[2]}/stock`
      try {
        const response = UrlFetchApp.fetch(requestUrl, options)
        if (response.getResponseCode() !== 204) throw new Error()
      } catch (e) {
        sendErrorMessage("ストック、失敗してまっせ。")
      }
    })
  })
}
function sendErrorMessage(message) {
  const options = {
    method: "post",
    payload: JSON.stringify({
      text: message,
      channel: SLACK_BOT_CHANNEL_ID,
    }),
    contentType: "application/json; charset=utf-8",
    headers: {
      Authorization: "Bearer " + SLACK_TOKEN,
    },
  }
  UrlFetchApp.fetch(SLACK_POST_MESSAGES, options)
}
// 環境変数から値を取得する
function getVal(e) {
  return PropertiesService.getScriptProperties().getProperty(e)
}
// 日本時間で今日の0時0分のUnixタイムスタンプを取得
function timestamp() {
  const now = new Date()
  const timezoneOffset = 9 * 60 // 日本時間はUTC+9
  now.setMinutes(now.getMinutes() + now.getTimezoneOffset() + timezoneOffset)
  now.setHours(0, 0, 0, 0)
  return Math.floor(now.getTime() / 1000)
}

