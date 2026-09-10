// src/utils/linear/client.js
//
// Thin, direct Linear GraphQL client -- no CLI, no Hermes gateway. Built
// 2026-09-09 as the webapp's half of Linear's "final form": one thin client
// per runtime (this one JS/Vercel, a separate Python one for Hermes' plugin),
// each doing only the raw API call, with no LLM/agent-specific formatting
// baked in here. See 0.Agents/Hermes/ARCHITECTURE.md and roadmap.md for the
// full reasoning -- this replaced an earlier version that routed reads
// through the Hermes gateway/chat, which was unnecessarily slow and
// laptop-dependent for what's just a fast structured-data read.
//
// Schema verified directly against Linear's real GraphQL schema (`linear
// schema -o schema.graphql`), not assumed from memory.

const LINEAR_API_URL = 'https://api.linear.app/graphql';

async function linearRequest(query, variables = {}) {
  const apiKey = process.env.LINEAR_API_KEY;
  if (!apiKey) {
    throw new Error('LINEAR_API_KEY not configured');
  }
  const res = await fetch(LINEAR_API_URL, {
    method: 'POST',
    headers: {
      Authorization: apiKey, // Linear's API key auth: raw key, no "Bearer " prefix
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  });
  const data = await res.json();
  if (data.errors) {
    throw new Error(data.errors.map((e) => e.message).join('; '));
  }
  return data.data;
}

const OPEN_ISSUES_QUERY = `
  query OpenIssues {
    issues(
      filter: { state: { type: { nin: ["completed", "canceled"] } } }
      first: 100
    ) {
      nodes {
        identifier
        title
        priorityLabel
        state { name }
        project { name }
      }
    }
  }
`;

// Returns issues grouped by project name, matching the shape the Morning
// Review page (and anything else displaying tasks) expects -- grouping done
// here in plain JS, no LLM involved, since there's no judgment needed for
// "which project does this issue belong to" (the API already tells us).
export async function getOpenTasksByProject() {
  const data = await linearRequest(OPEN_ISSUES_QUERY);
  const grouped = {};
  for (const issue of data.issues.nodes) {
    const project = issue.project?.name || 'No Project';
    if (!grouped[project]) grouped[project] = [];
    grouped[project].push({
      id: issue.identifier,
      title: issue.title,
      state: issue.state?.name,
      priority: issue.priorityLabel,
    });
  }
  return grouped;
}

const COMPLETE_ISSUE_MUTATION = `
  mutation CompleteIssue($id: String!, $stateId: String!) {
    issueUpdate(id: $id, input: { stateId: $stateId }) {
      success
    }
  }
`;

const WORKFLOW_STATES_QUERY = `
  query CompletedState($teamKey: String!) {
    teams(filter: { key: { eq: $teamKey } }) {
      nodes {
        states(filter: { type: { eq: "completed" } }) {
          nodes { id name }
        }
      }
    }
  }
`;

// Marks an issue complete. Takes the issue's team key (e.g. "JDU" from
// "JDU-34") since Linear's "completed" state is per-team, not global.
export async function completeTask(issueId, teamKey) {
  const stateData = await linearRequest(WORKFLOW_STATES_QUERY, { teamKey });
  const completedState = stateData.teams.nodes[0]?.states.nodes[0];
  if (!completedState) {
    throw new Error(`No "completed" workflow state found for team ${teamKey}`);
  }
  const result = await linearRequest(COMPLETE_ISSUE_MUTATION, {
    id: issueId,
    stateId: completedState.id,
  });
  return result.issueUpdate.success;
}

// ---------------------------------------------------------------------------
// Projects/Milestones -- backs the /projects page (and the homepage "Open
// Milestones" widget, and the completion trend chart). Built 2026-09-09 to
// replace the old Mongo Projects/Milestones collection with the SAME Linear
// data the migration script wrote (see roadmap.md) -- one source for the
// webapp and the agent. The old Mongo doc shape (nested Milestones map,
// "Project Priority", "Complete Date", etc.) is preserved on the wire here
// so the existing frontend (PrjList.js, MilestoneList.tsx, MilestoneCard.js,
// MilestoneTrendComponent.js) needed zero changes -- only this client and
// the /api/projects route changed.
//
// Projects have a native "priority" Int field (same 0-4 scale as issues) and
// a "statusId" for completion, used directly -- no encoding needed there.
// Linear has no native "type" field though, and no per-issue Target/Actual/
// Estimated-Size/Start-Date fields, so those ride along as a small JSON blob
// (project type) or plain-text "Key: value" line (issue extras) in the
// description, HTML-comment-wrapped so it doesn't show in Linear's rendered
// view. Round-trips through edits made here; anything added by hand in
// Linear's UI just won't carry those extra fields, which is fine -- they're
// optional everywhere they're read.

let _teamCache = null;
async function getTeam() {
  if (_teamCache) return _teamCache;
  const data = await linearRequest(`query { teams(first: 1) { nodes { id key
    states { nodes { id name type } } } } }`);
  const team = data.teams.nodes[0];
  if (!team) throw new Error('No Linear team found');
  _teamCache = team;
  return team;
}
function stateByType(team, type) {
  const s = team.states.nodes.find((s) => s.type === type);
  if (!s) throw new Error(`No "${type}" workflow state on team ${team.key}`);
  return s;
}

let _projectStatusCache = null;
async function getProjectStatuses() {
  if (_projectStatusCache) return _projectStatusCache;
  const data = await linearRequest(`query { projectStatuses { nodes { id name type } } }`);
  _projectStatusCache = data.projectStatuses.nodes;
  return _projectStatusCache;
}
async function projectStatusByType(type) {
  const statuses = await getProjectStatuses();
  const s = statuses.find((s) => s.type === type);
  if (!s) throw new Error(`No "${type}" project status found`);
  return s;
}

const dayOnly = (d) => (d ? String(d).slice(0, 10) : '');

// local 0(highest)..3(lowest) <-> Linear 1(Urgent)..4(Low), '' <-> 0(No priority)
const PRIORITY_TO_LINEAR = { '0': 1, '1': 2, '2': 3, '3': 4 };
const PRIORITY_FROM_LINEAR = { 1: '0', 2: '1', 3: '2', 4: '3', 0: '' };
// project priority is the raw local 0-5 ranking clamped into Linear's 0-4 Int field
const clampProjectPriority = (p) => Math.max(0, Math.min(4, Number(p) || 0));

function encodeProjectDescription(type, notes) {
  const meta = JSON.stringify({ type: type || '' });
  return `<!--meta:${meta}-->\n\n${notes || ''}`;
}
function decodeProjectDescription(desc) {
  const d = desc || '';
  const m = d.match(/^<!--meta:(.*?)-->\n?\n?/);
  let meta = { type: '' };
  let notes = d;
  if (m) {
    try { meta = { ...meta, ...JSON.parse(m[1]) }; } catch { /* malformed, ignore */ }
    notes = d.slice(m[0].length);
  }
  return { type: meta.type, notes: notes.trim() };
}

function encodeIssueDescription(fields) {
  const { notes, target, actual, startDate, estimatedSize, actualHours } = fields;
  const metaBits = [];
  if (startDate) metaBits.push(`Start: ${startDate}`);
  if (estimatedSize) metaBits.push(`Size: ${estimatedSize}`);
  if (actualHours) metaBits.push(`Hours: ${actualHours}`);
  if (target) metaBits.push(`Target: ${target}`);
  if (actual) metaBits.push(`Actual: ${actual}`);
  const meta = metaBits.length ? `\n\n${metaBits.join(' | ')}` : '';
  return `${notes || ''}${meta}`;
}
function pluck(desc, label) {
  const m = desc.match(new RegExp(`${label}:\\s*([^|\\n]+)`));
  return m ? m[1].trim() : '';
}
function decodeIssueDescription(desc) {
  const d = desc || '';
  const metaLineMatch = d.match(/\n\n((?:Start|Size|Hours|Target|Actual):.*)$/s);
  const metaLine = metaLineMatch ? metaLineMatch[1] : '';
  const notes = metaLineMatch ? d.slice(0, metaLineMatch.index).trim() : d.trim();
  return {
    notes,
    startDate: pluck(metaLine, 'Start'),
    estimatedSize: pluck(metaLine, 'Size'),
    actualHours: pluck(metaLine, 'Hours'),
    target: pluck(metaLine, 'Target'),
    actual: pluck(metaLine, 'Actual'),
  };
}

function issueToMilestone(issue) {
  const dec = decodeIssueDescription(issue.description);
  return {
    milestoneName: issue.title,
    'Milestone Priority': PRIORITY_FROM_LINEAR[issue.priority] ?? '',
    'Start Date': dec.startDate,
    'Due Date': issue.dueDate ? dayOnly(issue.dueDate) : '',
    'Complete Date': issue.completedAt ? dayOnly(issue.completedAt) : '',
    'Estimated Size': dec.estimatedSize,
    'Actual Hours': dec.actualHours,
    Notes: dec.notes,
    Target: dec.target,
    Actual: dec.actual,
    sortOrder: issue.sortOrder,
    _issueId: issue.id,
    _identifier: issue.identifier,
  };
}

// Two flat queries instead of one nested projects->issues query -- Linear's
// API rejects the nested first:100/first:100 combination as "too complex".
const ALL_PROJECTS_QUERY = `
  query AllProjects {
    projects(first: 100) { nodes { id name description state priority sortOrder completedAt } }
  }
`;
const ALL_ISSUES_QUERY = `
  query AllIssues {
    issues(first: 250) {
      nodes { id identifier title description priority sortOrder dueDate completedAt project { id } }
    }
  }
`;

// Returns the exact legacy Mongo-doc shape the frontend already expects, so
// PrjList.js / MilestoneList.tsx / MilestoneTrendComponent.js work unmodified.
export async function getAllProjectsWithMilestones() {
  const [projectsData, issuesData] = await Promise.all([
    linearRequest(ALL_PROJECTS_QUERY),
    linearRequest(ALL_ISSUES_QUERY),
  ]);
  const issuesByProject = {};
  for (const issue of issuesData.issues.nodes) {
    const pid = issue.project?.id;
    if (!pid) continue;
    (issuesByProject[pid] ||= []).push(issue);
  }
  return projectsData.projects.nodes.map((p) => {
    const { type, notes } = decodeProjectDescription(p.description);
    const milestones = {};
    for (const issue of issuesByProject[p.id] || []) {
      milestones[issue.title] = issueToMilestone(issue);
    }
    return {
      _id: p.id,
      'Project Name': p.name,
      'Project Priority': p.priority,
      Type: type,
      Notes: notes,
      'Project Complete Date': p.state === 'completed' ? dayOnly(p.completedAt) : null,
      sortOrder: p.sortOrder,
      Milestones: milestones,
    };
  });
}

export async function addProject(projectName, priority, type, notes) {
  const team = await getTeam();
  const result = await linearRequest(
    `mutation($input: ProjectCreateInput!) { projectCreate(input: $input) { success project { id } } }`,
    {
      input: {
        name: projectName,
        teamIds: [team.id],
        priority: clampProjectPriority(priority),
        description: encodeProjectDescription(type, notes),
      },
    }
  );
  return result.projectCreate;
}

export async function deleteProjectByName(projectName) {
  const projects = await getAllProjectsWithMilestones();
  const project = projects.find((p) => p['Project Name'] === projectName);
  if (!project) throw new Error(`Project not found: ${projectName}`);
  const result = await linearRequest(
    `mutation($id: String!) { projectDelete(id: $id) { success } }`,
    { id: project._id }
  );
  return result.projectDelete.success;
}

// updates: any of "Project Name"/"Project Priority"/"Type"/"Notes"/"Project Complete Date"
export async function updateProjectByRef(projectNameOrId, updates) {
  const projects = await getAllProjectsWithMilestones();
  const project = projects.find((p) => p['Project Name'] === projectNameOrId || p._id === projectNameOrId);
  if (!project) throw new Error(`Project not found: ${projectNameOrId}`);

  const input = {};
  if (updates['Project Name'] !== undefined) input.name = updates['Project Name'];
  if (updates['Project Priority'] !== undefined) input.priority = clampProjectPriority(updates['Project Priority']);

  if (updates['Project Complete Date'] !== undefined) {
    const status = await projectStatusByType(updates['Project Complete Date'] ? 'completed' : 'backlog');
    input.statusId = status.id;
  }

  const nextType = updates['Type'] !== undefined ? updates['Type'] : project['Type'];
  const nextNotes = updates['Notes'] !== undefined ? updates['Notes'] : project['Notes'];
  if (updates['Type'] !== undefined || updates['Notes'] !== undefined) {
    input.description = encodeProjectDescription(nextType, nextNotes);
  }

  // Drag-reorder in the projects rail -- caller computes the midpoint float
  // between the two neighbors' sortOrder values.
  if (updates.sortOrder !== undefined) input.sortOrder = updates.sortOrder;

  const result = await linearRequest(
    `mutation($id: String!, $input: ProjectUpdateInput!) { projectUpdate(id: $id, input: $input) { success } }`,
    { id: project._id, input }
  );
  return result.projectUpdate.success;
}

export async function addMilestoneToProject(projectName, milestone, msName) {
  const team = await getTeam();
  const projects = await getAllProjectsWithMilestones();
  const project = projects.find((p) => p['Project Name'] === projectName);
  if (!project) throw new Error(`Project not found: ${projectName}`);

  const priority = PRIORITY_TO_LINEAR[milestone['Milestone Priority']] ?? 0;
  const input = {
    teamId: team.id,
    projectId: project._id,
    title: msName,
    priority,
    description: encodeIssueDescription({
      notes: milestone.Notes,
      target: milestone.Target,
      actual: milestone.Actual,
      startDate: milestone['Start Date'],
      estimatedSize: milestone['Estimated Size'],
      actualHours: milestone['Actual Hours'],
    }),
  };
  if (milestone['Due Date']) input.dueDate = milestone['Due Date'];
  if (milestone['Complete Date']) input.stateId = stateByType(team, 'completed').id;

  const result = await linearRequest(
    `mutation($input: IssueCreateInput!) { issueCreate(input: $input) { success issue { id } } }`,
    { input }
  );
  return result.issueCreate.success;
}

async function findIssueByTitleInProject(projectId, milestoneName) {
  const data = await linearRequest(
    `query($projectId: ID!) { issues(filter: { project: { id: { eq: $projectId } } }, first: 100) {
      nodes { id title priority dueDate completedAt description } } }`,
    { projectId }
  );
  const issue = data.issues.nodes.find((i) => i.title === milestoneName);
  if (!issue) throw new Error(`Milestone not found: ${milestoneName}`);
  return issue;
}

export async function updateMilestoneByName(projectId, milestoneName, updates) {
  const team = await getTeam();
  const issue = await findIssueByTitleInProject(projectId, milestoneName);
  const current = issueToMilestone(issue);

  const merged = { ...current, ...updates };
  const input = {};
  if (updates['Milestone Priority'] !== undefined) {
    input.priority = PRIORITY_TO_LINEAR[updates['Milestone Priority']] ?? 0;
  }
  if (updates['Due Date'] !== undefined) input.dueDate = updates['Due Date'] || null;
  if (updates['Complete Date'] !== undefined) {
    input.stateId = updates['Complete Date']
      ? stateByType(team, 'completed').id
      : stateByType(team, 'backlog').id;
  }
  // Drag-reorder within a project's milestone list.
  if (updates.sortOrder !== undefined) input.sortOrder = updates.sortOrder;
  input.description = encodeIssueDescription({
    notes: merged.Notes,
    target: merged.Target,
    actual: merged.Actual,
    startDate: merged['Start Date'],
    estimatedSize: merged['Estimated Size'],
    actualHours: merged['Actual Hours'],
  });

  const result = await linearRequest(
    `mutation($id: String!, $input: IssueUpdateInput!) { issueUpdate(id: $id, input: $input) { success } }`,
    { id: issue.id, input }
  );
  return result.issueUpdate.success;
}

export async function deleteMilestoneByName(projectId, milestoneName) {
  const issue = await findIssueByTitleInProject(projectId, milestoneName);
  const result = await linearRequest(
    `mutation($id: String!) { issueDelete(id: $id) { success } }`,
    { id: issue.id }
  );
  return result.issueDelete.success;
}

// ---------------------------------------------------------------------------
// ToDos -- the center "tasks" pane on /work. Split out 2026-09-09 from a
// separate, older Linear client (src/utils/linear.js, now retired) that
// queried every issue across every project with no project filter -- this
// scopes strictly to the "ToDos" project, which is what "ToDos" is for
// (open-ended personal tasks/errands, per its own Linear description).
// Other projects' issues are milestones, browsed via the projects rail, not
// this pane.

const TODOS_PROJECT_NAME = 'ToDos';
const TASK_PRIORITY_FROM_LINEAR = { 1: 'P0', 2: 'P1', 3: 'P2', 4: 'P3' };
const TASK_PRIORITY_TO_LINEAR = { P0: 1, P1: 2, P2: 3, P3: 4 };

function issueToTask(issue) {
  const due = issue.dueDate ? dayOnly(issue.dueDate) : null;
  return {
    _id: issue.id,
    'Task Name': issue.title,
    'Due Date': due,
    'Complete Date': issue.completedAt ? dayOnly(issue.completedAt) : null,
    Priority: TASK_PRIORITY_FROM_LINEAR[issue.priority] || 'P3',
    Type: 'Task',
    Size: '',
    // Linear has no "missed" flag -- approximate it as open + past due.
    Missed: !issue.completedAt && !!due && due < dayOnly(new Date().toISOString()),
    sortOrder: issue.sortOrder,
  };
}

let _todosProjectIdCache = null;
async function getToDosProjectId() {
  if (_todosProjectIdCache) return _todosProjectIdCache;
  const data = await linearRequest(
    `query($name: String!) { projects(filter: { name: { eq: $name } }, first: 1) { nodes { id } } }`,
    { name: TODOS_PROJECT_NAME }
  );
  const p = data.projects.nodes[0];
  if (!p) throw new Error(`"${TODOS_PROJECT_NAME}" project not found in Linear`);
  _todosProjectIdCache = p.id;
  return p.id;
}

export async function getToDosTasks() {
  const projectId = await getToDosProjectId();
  const data = await linearRequest(
    `query($projectId: ID!) { issues(filter: { project: { id: { eq: $projectId } } }, first: 250) {
      nodes { id title dueDate completedAt priority sortOrder } } }`,
    { projectId }
  );
  return data.issues.nodes.map(issueToTask).sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
}

export async function createToDosTask(fields) {
  const team = await getTeam();
  const projectId = await getToDosProjectId();
  const input = {
    teamId: team.id,
    projectId,
    title: fields['Task Name'],
    priority: TASK_PRIORITY_TO_LINEAR[fields.Priority] || 0,
  };
  if (fields['Due Date']) input.dueDate = fields['Due Date'];
  const result = await linearRequest(
    `mutation($input: IssueCreateInput!) { issueCreate(input: $input) { success issue { id } } }`,
    { input }
  );
  return result.issueCreate;
}

// Used for both completing/editing a ToDos task and drag-reordering it.
export async function updateTaskById(issueId, fields) {
  const team = await getTeam();
  const input = {};
  if (fields['Task Name'] != null) input.title = fields['Task Name'];
  if (fields.Priority != null) input.priority = TASK_PRIORITY_TO_LINEAR[fields.Priority] || 0;
  if (fields['Due Date'] !== undefined) input.dueDate = fields['Due Date'] || null;
  if (fields.sortOrder !== undefined) input.sortOrder = fields.sortOrder;
  if (fields['Complete Date'] !== undefined) {
    input.stateId = fields['Complete Date']
      ? stateByType(team, 'completed').id
      : stateByType(team, 'backlog').id;
  }
  const result = await linearRequest(
    `mutation($id: String!, $input: IssueUpdateInput!) { issueUpdate(id: $id, input: $input) { success } }`,
    { id: issueId, input }
  );
  return result.issueUpdate.success;
}
