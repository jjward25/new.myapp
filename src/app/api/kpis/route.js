// src/app/api/kpis/route.js
import { NextResponse } from 'next/server';
import clientPromise from '@/utils/mongoDB/mongoConnect';
import { APP_DB } from '@/utils/mongoDB/dbName';
import { getWeekBoundsEST, getNowEST, formatDateEST } from '@/utils/dateUtils';
import { getToDosTasks } from '@/utils/linear/client';
import { listWorkoutEntries } from '@/utils/mongoDB/hermesWorkouts';
import { gcalConfigured, listEvents } from '@/utils/gcal';

export const dynamic = 'force-dynamic';

const inRange = (d, start, end) => d && d >= start && d <= end;

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db(APP_DB);

    const nowEST = getNowEST();
    const todayStr = formatDateEST(nowEST);
    const thisWeek = getWeekBoundsEST(nowEST);
    const lastWeekDate = new Date(nowEST);
    lastWeekDate.setDate(lastWeekDate.getDate() - 7);
    const lastWeek = getWeekBoundsEST(lastWeekDate);

    const [workoutEntries, backlog, calendar] = await Promise.all([
      listWorkoutEntries({ sinceDays: 30 }).catch(() => []),
      db.collection('Backlog').find({}).toArray(),
      db.collection('Calendar').find({}).toArray(),
    ]);

    // 1. Miles run — Personal.Activities (Apple Health push) with a fallback
    //    to whatever cardio was logged in the simple workout tracker
    let milesThisWeek = 0;
    let milesLastWeek = 0;
    let source = 'workouts';
    const activities = await db
      .collection('Activities')
      .find({ type: { $in: ['Run', 'run', 'TrailRun', 'VirtualRun'] } })
      .toArray()
      .catch(() => []);
    if (activities.length) {
      source = 'activities';
      let overrideMiles = null;
      activities.forEach((a) => {
        // A manual override for this week replaces the computed sum rather
        // than adding to it (see /api/kpis/miles) — skip it here and apply
        // it after the loop.
        if (a.manualOverride && inRange(a.date, thisWeek.start, thisWeek.end)) {
          overrideMiles = Number(a.miles) || 0;
          return;
        }
        if (inRange(a.date, thisWeek.start, thisWeek.end)) milesThisWeek += Number(a.miles) || 0;
        else if (inRange(a.date, lastWeek.start, lastWeek.end)) milesLastWeek += Number(a.miles) || 0;
      });
      if (overrideMiles !== null) {
        milesThisWeek = overrideMiles;
        source = 'manual';
      }
    } else {
      workoutEntries.forEach((e) => {
        const miles = Number(e.cardio?.miles) || 0;
        if (!miles) return;
        if (inRange(e.date, thisWeek.start, thisWeek.end)) milesThisWeek += miles;
        else if (inRange(e.date, lastWeek.start, lastWeek.end)) milesLastWeek += miles;
      });
    }

    // 2 + 3. Task metrics — the ToDos project only (same scope as the /work
    // center pane). Deliberately excludes other projects' issues: those are
    // milestones, tracked separately, and mixing them in used to inflate
    // "completed this week" with milestone-completion history.
    let completedThisWeek = 0;
    let completedLastWeek = 0;
    // dueTotal* counts EVERY task due in that week regardless of completion
    // status -- a pure due-date volume comparison, separate from openDue
    // below (which only counts still-open tasks).
    let dueTotalThisWeek = 0;
    let dueTotalLastWeek = 0;
    const openDue = { thisWeek: 0, lastWeek: 0, p0: 0, p1: 0, p2plus: 0, overdue: 0, stale: 0 };

    const tally = (rows) => {
      rows.forEach((t) => {
        const cd = t['Complete Date'];
        if (inRange(cd, thisWeek.start, thisWeek.end)) completedThisWeek++;
        else if (inRange(cd, lastWeek.start, lastWeek.end)) completedLastWeek++;

        const due = t['Due Date'];
        if (inRange(due, thisWeek.start, thisWeek.end)) dueTotalThisWeek++;
        else if (inRange(due, lastWeek.start, lastWeek.end)) dueTotalLastWeek++;

        // Note: deliberately NOT skipping on t.Missed here -- that flag (see
        // issueToTask) is just "open + due date before today," which is
        // exactly the overdue-but-still-open case openDue.overdue exists to
        // catch below. Skipping on it silently dropped overdue tasks from
        // "Open due this week" entirely.
        if (t['Complete Date']) return;
        if (inRange(due, thisWeek.start, thisWeek.end)) {
          openDue.thisWeek++;
          const p = String(t.Priority || '').toUpperCase();
          if (p === 'P0') openDue.p0++;
          else if (p === 'P1') openDue.p1++;
          else openDue.p2plus++;
          if (due < todayStr) openDue.overdue++;
        } else if (inRange(due, lastWeek.start, lastWeek.end)) {
          openDue.lastWeek++;
        } else if (due && due < thisWeek.start) {
          // Open and due before this week even started -- older than the
          // "late this week" bucket above.
          openDue.stale++;
        }
      });
    };

    try {
      tally(await getToDosTasks());
    } catch (e) {
      console.error('kpi linear', e);
      tally(backlog);
    }

    // 4. Events scheduled this week + the next 3 upcoming. Gcal is the real
    // source of truth (and the only place with a time-of-day) when
    // configured; the Mongo cache (date-only) is the fallback.
    let eventList = calendar.map((e) => ({ title: e.title, date: e.date, time: '' }));
    if (gcalConfigured()) {
      try {
        const timeMin = new Date(lastWeek.start).toISOString();
        const timeMax = new Date(nowEST);
        timeMax.setDate(timeMax.getDate() + 30);
        const g = await listEvents(timeMin, timeMax.toISOString());
        eventList = g.map((e) => ({ title: e.title, date: e.date, time: e.time || '' }));
      } catch (e) {
        console.error('kpi gcal', e);
      }
    }

    let eventsThisWeek = 0;
    let eventsLastWeek = 0;
    const upcoming = [];
    eventList.forEach((e) => {
      const d = e.date;
      if (inRange(d, thisWeek.start, thisWeek.end)) eventsThisWeek++;
      else if (inRange(d, lastWeek.start, lastWeek.end)) eventsLastWeek++;
      if (d && d >= todayStr) upcoming.push(e);
    });
    upcoming.sort((a, b) => (a.date + (a.time || '00:00')).localeCompare(b.date + (b.time || '00:00')));

    return NextResponse.json({
      miles: { thisWeek: Math.round(milesThisWeek * 10) / 10, lastWeek: Math.round(milesLastWeek * 10) / 10, goal: 3, source },
      tasksCompleted: { thisWeek: completedThisWeek, lastWeek: completedLastWeek },
      openTasksDue: { ...openDue, dueTotalThisWeek, dueTotalLastWeek },
      events: { thisWeek: eventsThisWeek, lastWeek: eventsLastWeek, upcoming: upcoming.slice(0, 3) },
    });
  } catch (error) {
    console.error('Error fetching KPIs:', error);
    return NextResponse.json({ error: 'Failed to fetch KPIs' }, { status: 500 });
  }
}
