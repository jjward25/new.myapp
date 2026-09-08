// src/utils/linear.js — Linear GraphQL, thin.
// Env: LINEAR_API_KEY, LINEAR_TEAM_ID
const ENDPOINT = 'https://api.linear.app/graphql';

export function linearConfigured() {
  return !!(process.env.LINEAR_API_KEY && process.env.LINEAR_TEAM_ID);
}

async function gql(query, variables) {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: process.env.LINEAR_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors) throw new Error('linear: ' + JSON.stringify(json.errors));
  return json.data;
}

// app priority P0..P3  <->  linear 1..4 (0 = none)
const toLinearPriority = (p) => ({ P0: 1, P1: 2, P2: 3, P3: 4 }[String(p).toUpperCase()] || 0);
const fromLinearPriority = (n) => ({ 1: 'P0', 2: 'P1', 3: 'P2', 4: 'P3' }[n] || 'P3');

function normalize(issue) {
  return {
    _id: issue.id,
    linearId: issue.id,
    identifier: issue.identifier,
    url: issue.url,
    'Task Name': issue.title,
    'Due Date': issue.dueDate || null,
    'Complete Date': issue.completedAt ? issue.completedAt.slice(0, 10) : null,
    Priority: fromLinearPriority(issue.priority),
    Type: 'Task',
    Size: (issue.labels?.nodes || []).find((l) => l.name?.startsWith('size:'))?.name.slice(5) || '',
    Missed: false,
    stateType: issue.state?.type,
  };
}

const ISSUE_FIELDS = `
  id identifier url title dueDate priority completedAt
  state { type name }
  labels { nodes { name } }
`;

export async function listIssues({ completed = null, dueBefore = null, dueAfter = null, first = 100 } = {}) {
  const filter = { team: { id: { eq: process.env.LINEAR_TEAM_ID } } };
  if (completed === true) filter.completedAt = { null: false };
  if (completed === false) filter.completedAt = { null: true };
  if (dueBefore) filter.dueDate = { ...(filter.dueDate || {}), lte: dueBefore };
  if (dueAfter) filter.dueDate = { ...(filter.dueDate || {}), gte: dueAfter };

  const data = await gql(
    `query($filter: IssueFilter, $first: Int) {
       issues(filter: $filter, first: $first, orderBy: updatedAt) {
         nodes { ${ISSUE_FIELDS} }
       }
     }`,
    { filter, first }
  );
  return data.issues.nodes.map(normalize);
}

let _doneStateId = null;
async function completedStateId() {
  if (_doneStateId) return _doneStateId;
  const data = await gql(
    `query($id: String!) { team(id: $id) { states { nodes { id type } } } }`,
    { id: process.env.LINEAR_TEAM_ID }
  );
  const done = data.team.states.nodes.find((s) => s.type === 'completed');
  _doneStateId = done?.id || null;
  return _doneStateId;
}

export async function createIssue({ title, description = '', priority = 'P1', dueDate = null }) {
  const data = await gql(
    `mutation($input: IssueCreateInput!) {
       issueCreate(input: $input) { issue { ${ISSUE_FIELDS} } }
     }`,
    {
      input: {
        teamId: process.env.LINEAR_TEAM_ID,
        title,
        description,
        priority: toLinearPriority(priority),
        ...(dueDate ? { dueDate } : {}),
      },
    }
  );
  return normalize(data.issueCreate.issue);
}

export async function updateIssue(id, fields) {
  const input = {};
  if (fields['Task Name'] != null) input.title = fields['Task Name'];
  if (fields.Priority != null) input.priority = toLinearPriority(fields.Priority);
  if (fields['Due Date'] != null) input.dueDate = fields['Due Date'] || null;
  if (fields.Notes != null) input.description = fields.Notes;
  if (fields['Complete Date']) input.stateId = await completedStateId();

  const data = await gql(
    `mutation($id: String!, $input: IssueUpdateInput!) {
       issueUpdate(id: $id, input: $input) { issue { ${ISSUE_FIELDS} } }
     }`,
    { id, input }
  );
  return normalize(data.issueUpdate.issue);
}

export async function completeIssue(id) {
  return updateIssue(id, { 'Complete Date': new Date().toISOString().slice(0, 10) });
}
