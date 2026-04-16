const fs = require('fs')
const path = require('path')
const envContent = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8')
envContent.split('\n').forEach(line => {
  const [key, ...vals] = line.split('=')
  if (key && vals.length) process.env[key.trim()] = vals.join('=').trim()
})

const LINEAR_API_KEY = process.env.LINEAR_API_KEY
const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL

const TEAM_EMAILS = {
  ruby: '0b02f585-36c4-4a08-ae54-fe07b71c91f0',   // Choux Kim
  ellie: '8cbf8119-865a-4282-b215-869e696badc1',   // Ellie - Backend
  seonghyun: 'seonghyunnam.us@gmail.com'            // Seonghyun - Design
}

async function fetchAllIssues() {
  const query = `
    query {
      issues(
        filter: {
          team: { name: { eq: "MEVE Core" } }
          state: { type: { nin: ["completed", "cancelled"] } }
        }
        first: 100
        orderBy: updatedAt
      ) {
        nodes {
          identifier
          title
          priority
          state { name type }
          dueDate
          assignee { id name email }
          projectMilestone { name targetDate }
        }
      }
    }
  `
  const res = await fetch('https://api.linear.app/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': LINEAR_API_KEY
    },
    body: JSON.stringify({ query })
  })
  const data = await res.json()
  if (data.errors) throw new Error(JSON.stringify(data.errors))
  return data.data.issues.nodes
}

async function sendSlackMessage(text) {
  const res = await fetch(SLACK_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text })
  })
  if (!res.ok) throw new Error(`Slack error: ${res.status}`)
}

async function main() {
  const issues = await fetchAllIssues()

  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const todayStr = today.toISOString().split('T')[0]
  const tomorrowStr = tomorrow.toISOString().split('T')[0]

  const dateKR = today.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'long' })
  const dateEN = today.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', weekday: 'long' })

  // Categorize by assignee
  const designIssues = issues.filter(i => i.assignee?.email === 'seonghyunnam.us@gmail.com')
  const backendIssues = issues.filter(i => i.assignee?.email === 'choellie05@gmail.com')
  const frontendIssues = issues.filter(i =>
    i.assignee?.id === '0b02f585-36c4-4a08-ae54-fe07b71c91f0' ||
    i.title.includes('[RUBY]') ||
    (!i.assignee && !i.title.includes('[BE]') && !i.title.includes('[DESIGN]'))
  )
  const dueSoon = issues.filter(i => i.dueDate === todayStr || i.dueDate === tomorrowStr)

  const priorityIcon = (p) => p === 1 ? '🚨' : p === 2 ? '🔴' : '🔵'
  const formatIssue = (i) => {
    const due = i.dueDate ? ` — Due: ${i.dueDate}` : ''
    return `${priorityIcon(i.priority)} \`${i.identifier}\` ${i.title}${due}`
  }

  let msg = ''
  msg += `🌸 *meve Daily Briefing | ${dateKR} / ${dateEN}*\n\n`
  msg += `📍 *현재 스프린트 / Current Sprint:* Sprint 2 — Core Features _(Due Apr 18)_\n`
  msg += `⏭️ *다음 마일스톤 / Next Milestone:* Internal TestFlight — Apr 21\n`
  msg += `\n━━━━━━━━━━━━━━━━━━━━\n\n`

  // Design
  msg += `🎨 *DESIGN — 성현 (Seonghyun)*\n`
  msg += `디자인 할 일 / Design Tasks:\n`
  if (designIssues.length > 0) {
    designIssues.forEach(i => msg += `${formatIssue(i)}\n`)
  } else {
    msg += `• 현재 assign된 디자인 이슈 없음 / No assigned design issues\n`
  }
  msg += `\n━━━━━━━━━━━━━━━━━━━━\n\n`

  // Backend
  msg += `⚙️ *BACKEND — Ellie*\n`
  msg += `백엔드 할 일 / Backend Tasks:\n`
  if (backendIssues.length > 0) {
    backendIssues.forEach(i => msg += `${formatIssue(i)}\n`)
  } else {
    msg += `• 백엔드 이슈 없음 / No backend issues\n`
  }
  msg += `\n━━━━━━━━━━━━━━━━━━━━\n\n`

  // Frontend
  msg += `💻 *FRONTEND — Ruby*\n`
  msg += `프론트엔드 할 일 / Frontend Tasks:\n`
  if (frontendIssues.length > 0) {
    frontendIssues.slice(0, 8).forEach(i => msg += `${formatIssue(i)}\n`)
  } else {
    msg += `• 프론트엔드 이슈 없음 / No frontend issues\n`
  }
  msg += `\n━━━━━━━━━━━━━━━━━━━━\n\n`

  // Due soon
  if (dueSoon.length > 0) {
    msg += `⏰ *마감 임박 / Due Soon*\n`
    dueSoon.forEach(i => {
      const isToday = i.dueDate === todayStr
      msg += `${isToday ? '❗' : '⚠️'} \`${i.identifier}\` ${i.title} — ${isToday ? '오늘 TODAY' : '내일 TOMORROW'}\n`
    })
    msg += `\n━━━━━━━━━━━━━━━━━━━━\n\n`
  }

  msg += `_meve Daily Briefing Bot | linear.app/meve_`

  await sendSlackMessage(msg)
  console.log('✅ Sent!')
}

main().catch(err => {
  console.error('❌', err.message)
  process.exit(1)
})
