const VERCEL_API_BASE_URL = 'https://api.vercel.com';
const DEFAULT_LIMITS = {
  projects: 6,
  deployments: 8,
};

function sendJson(response, statusCode, payload) {
  response.statusCode = statusCode;
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.setHeader('Cache-Control', 'no-store');
  response.end(JSON.stringify(payload));
}

function buildApiUrl(pathname, params = {}) {
  const url = new URL(pathname, VERCEL_API_BASE_URL);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  });
  return url;
}

async function fetchFromVercel(pathname, params = {}) {
  const token = process.env.VERCEL_API_TOKEN;

  if (!token) {
    const error = new Error('VERCEL_API_TOKEN is not configured.');
    error.statusCode = 500;
    throw error;
  }

  const url = buildApiUrl(pathname, params);
  const apiResponse = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });
  const payload = await apiResponse.json().catch(() => ({}));

  if (!apiResponse.ok) {
    const error = new Error(payload?.error?.message || `Vercel API returned ${apiResponse.status}.`);
    error.statusCode = apiResponse.status;
    error.details = payload;
    throw error;
  }

  return payload;
}

function normalizeProject(project) {
  return {
    id: project.id,
    name: project.name,
    framework: project.framework || 'other',
    updatedAt: project.updatedAt,
    targets: project.targets || {},
    accountId: project.accountId,
  };
}

function normalizeDeployment(deployment) {
  return {
    uid: deployment.uid,
    name: deployment.name,
    url: deployment.url ? `https://${deployment.url}` : null,
    state: deployment.state,
    target: deployment.target || deployment.environment || 'unknown',
    createdAt: deployment.createdAt,
    creator: deployment.creator?.username || deployment.creator?.email || 'unknown',
  };
}

module.exports = async function handler(request, response) {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET');
    sendJson(response, 405, { error: 'Method not allowed.' });
    return;
  }

  const requestUrl = new URL(request.url, `https://${request.headers.host || 'localhost'}`);
  const teamId = requestUrl.searchParams.get('teamId') || process.env.VERCEL_TEAM_ID || undefined;
  const projectLimit = requestUrl.searchParams.get('projectLimit') || DEFAULT_LIMITS.projects;
  const deploymentLimit = requestUrl.searchParams.get('deploymentLimit') || DEFAULT_LIMITS.deployments;
  const commonParams = { teamId };

  try {
    const [user, projectsPayload, deploymentsPayload] = await Promise.all([
      fetchFromVercel('/v2/user', commonParams),
      fetchFromVercel('/v9/projects', { ...commonParams, limit: projectLimit }),
      fetchFromVercel('/v6/deployments', { ...commonParams, limit: deploymentLimit }),
    ]);

    sendJson(response, 200, {
      connected: true,
      fetchedAt: new Date().toISOString(),
      user: {
        id: user.user?.id,
        username: user.user?.username,
        email: user.user?.email,
        name: user.user?.name,
      },
      projects: (projectsPayload.projects || []).map(normalizeProject),
      deployments: (deploymentsPayload.deployments || []).map(normalizeDeployment),
    });
  } catch (error) {
    sendJson(response, error.statusCode || 500, {
      connected: false,
      error: error.message,
      details: error.details,
    });
  }
};
