const http = require('http');
const fs = require('fs');
const path = require('path');

const seedPath = path.join(__dirname, '..', 'data', 'seed.json');
const seed = JSON.parse(fs.readFileSync(seedPath, 'utf8'));

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization'
  });
  res.end(JSON.stringify(payload, null, 2));
}

function sendHtml(res, statusCode, html) {
  res.writeHead(statusCode, {
    'Content-Type': 'text/html; charset=utf-8',
    'Access-Control-Allow-Origin': '*'
  });
  res.end(html);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      if (!body) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(error);
      }
    });
  });
}

function listCourses(query) {
  const keyword = (query.get('keyword') || '').trim().toLowerCase();
  const programmeId = query.get('programme_id');
  const majorId = query.get('major_id');
  const courseType = query.get('course_type');
  const hasPrerequisite = query.get('has_prerequisite');

  return seed.courses.filter((course) => {
    const matchesProgramme = !programmeId || course.programmeId === Number(programmeId);
    const matchesMajor = !majorId || course.majorId === Number(majorId);
    const matchesType = !courseType || courseType === 'all' || course.courseType === courseType;
    const matchesKeyword = !keyword
      || course.courseCode.toLowerCase().includes(keyword)
      || course.titleEn.toLowerCase().includes(keyword)
      || (course.titleZh || '').toLowerCase().includes(keyword);
    const matchesPrereq = !hasPrerequisite
      || (hasPrerequisite === 'true' ? course.prerequisites !== 'None' : course.prerequisites === 'None');
    return matchesProgramme && matchesMajor && matchesType && matchesKeyword && matchesPrereq;
  });
}

function buildAudit(payload) {
  const programmeId = Number(payload.programmeId || 1);
  const majorId = Number(payload.majorId || 1);
  const curriculumYear = payload.curriculumYear || '2026';
  const completedCourseIds = (payload.completedCourseIds || []).map(Number);
  const programme = seed.programmes.find((item) => item.id === programmeId);
  const completedCourses = seed.courses.filter((course) => completedCourseIds.includes(course.id));
  const completedCredits = completedCourses.reduce((sum, course) => sum + course.credits, 0);

  const sections = seed.requirements
    .filter((item) => item.programmeId === programmeId && item.majorId === majorId && item.curriculumYear === curriculumYear)
    .map((requirement) => {
      const requirementCourses = seed.courses.filter((course) => requirement.courseIds.includes(course.id));
      const done = requirementCourses.filter((course) => completedCourseIds.includes(course.id));
      const doneCredits = done.reduce((sum, course) => sum + course.credits, 0);
      return {
        type: requirement.type,
        name: requirement.name,
        requiredCredits: requirement.requiredCredits,
        completedCredits: Math.min(doneCredits, requirement.requiredCredits),
        missingCourses: requirementCourses.filter((course) => !completedCourseIds.includes(course.id))
      };
    });

  return {
    totalCreditsRequired: programme ? programme.totalCreditRequired : 0,
    completedCredits,
    sections,
    recommendations: sections
      .flatMap((section) => section.missingCourses.map((course) => ({
        courseCode: course.courseCode,
        courseTitle: course.titleEn,
        reason: section.type === 'core' ? 'Core course not completed' : `${section.name} requirement not completed`
      })))
      .slice(0, 4)
  };
}

async function handleRequest(req, res) {
  if (req.method === 'OPTIONS') {
    sendJson(res, 200, {});
    return;
  }

  const url = new URL(req.url, 'http://localhost');

  if (req.method === 'GET' && url.pathname === '/') {
    sendHtml(res, 200, `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>选课港 API</title>
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; margin: 40px; color: #17231f; background: #f6f7f5; }
      main { max-width: 760px; background: #fff; border: 1px solid #e2e7e1; border-radius: 12px; padding: 28px; }
      h1 { margin-top: 0; color: #1f6f5b; }
      code { background: #eef4f0; border-radius: 6px; padding: 2px 6px; }
      li { margin: 10px 0; }
      a { color: #1f6f5b; }
    </style>
  </head>
  <body>
    <main>
      <h1>选课港 API 正在运行</h1>
      <p>这是本地 MVP mock API。小程序会优先请求这些接口；如果 API 不可用，会自动回退到本地缓存数据。</p>
      <ul>
        <li><a href="/api/health"><code>GET /api/health</code></a></li>
        <li><a href="/api/universities"><code>GET /api/universities</code></a></li>
        <li><a href="/api/programmes?university_id=1"><code>GET /api/programmes?university_id=1</code></a></li>
        <li><a href="/api/courses?programme_id=1&major_id=1"><code>GET /api/courses?programme_id=1&major_id=1</code></a></li>
      </ul>
    </main>
  </body>
</html>`);
    return;
  }

  if (req.method === 'GET' && url.pathname === '/api/health') {
    sendJson(res, 200, { ok: true, service: 'course-planner-api' });
    return;
  }

  if (req.method === 'GET' && url.pathname === '/api/universities') {
    sendJson(res, 200, seed.universities);
    return;
  }

  if (req.method === 'GET' && url.pathname === '/api/faculties') {
    const universityId = url.searchParams.get('university_id');
    sendJson(res, 200, seed.faculties.filter((item) => !universityId || item.universityId === Number(universityId)));
    return;
  }

  if (req.method === 'GET' && url.pathname === '/api/programmes') {
    const universityId = url.searchParams.get('university_id');
    sendJson(res, 200, seed.programmes.filter((item) => !universityId || item.universityId === Number(universityId)));
    return;
  }

  if (req.method === 'GET' && url.pathname === '/api/majors') {
    const programmeId = url.searchParams.get('programme_id');
    sendJson(res, 200, seed.majors.filter((item) => !programmeId || item.programmeId === Number(programmeId)));
    return;
  }

  if (req.method === 'GET' && url.pathname === '/api/courses') {
    sendJson(res, 200, listCourses(url.searchParams));
    return;
  }

  const courseMatch = url.pathname.match(/^\/api\/courses\/(\d+)$/);
  if (req.method === 'GET' && courseMatch) {
    const course = seed.courses.find((item) => item.id === Number(courseMatch[1]));
    sendJson(res, course ? 200 : 404, course || { error: 'Course not found' });
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/graduation-audit') {
    try {
      const payload = await readBody(req);
      sendJson(res, 200, buildAudit(payload));
    } catch (error) {
      sendJson(res, 400, { error: 'Invalid JSON body' });
    }
    return;
  }

  sendJson(res, 404, { error: 'Not found' });
}

if (process.argv.includes('--check')) {
  console.log(JSON.stringify({ ok: true, courses: seed.courses.length, requirements: seed.requirements.length }));
} else {
  const port = Number(process.env.PORT || 3000);
  http.createServer(handleRequest).listen(port, () => {
    console.log(`Course planner API listening on http://localhost:${port}`);
  });
}
