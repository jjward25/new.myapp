// src/app/api/kpis/route.js
import { NextResponse } from 'next/server';
import clientPromise from '@/utils/mongoDB/mongoConnect';
import { getWeekBoundsEST, getNowEST, formatDateEST } from '@/utils/dateUtils';
import { linearConfigured, listIssues } from '@/utils/linear';

export const dynamic = 'force-dynamic';

const inRange = (d, start, end) => d && d >= start && d <= end;

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db('Personal');

    const nowEST = getNowEST();
    const todayStr = formatDateEST(nowEST);
    const thisWeek = getWeekBoundsEST(nowEST);
    const lastWeekDate = new Date(nowEST);
    lastWeekDate.setDate(lastWeekDate.getDate() - 7);
    const lastWeek = getWeekBoundsEST(lastWeekDate);

    const [workoutData, backlog, calendar] = await Promise.all([
      db.collection('Workouts').find({}).toArray(),
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
      activities.forEach((a) => {
        if (inRange(a.date, thisWeek.start, thisWeek.end)) milesThisWeek += Number(a.miles) || 0;
        else if (inRange(a.date, lastWeek.start, lastWeek.end)) milesLastWeek += Number(a.miles) || 0;
      });
    } else {
      const simple = (workoutData[0]?.Workouts || []).filter((w) => w.Type === 'simple');
      simple.forEach((w) => {
        (w.Exercises || []).forEach((ex) => {
          if (ex.Category === 'Cardio' && ex.Miles) {
            if (inRange(w.Date, thisWeek.start, thisWeek.end)) milesThisWeek += Number(ex.Miles) || 0;
            else if (inRange(w.Date, lastWeek.start, lastWeek.end)) milesLastWeek += Number(ex.Miles) || 0;
          }
        });
      });
    }

    // 2 + 3. Task metrics — Linear when configured, else Personal.Backlog
    let completedThisWeek = 0;
    let completedLastWeek = 0;
    const openDue = { thisWeek: 0, lastWeek: 0, p0: 0, p1: 0, p2plus: 0, overdue: 0 };

    const tally = (rows) => {
      rows.forEach((t) => {
        const cd = t['Complete Date'];
        if (inRange(cd, thisWeek.start, thisWeek.end)) completedThisWeek++;
        else if (inRange(cd, lastWeek.start, lastWeek.end)) completedLastWeek++;

        if (t['Complete Date'] || t.Missed === true) return;
        const due = t['Due Date'];
        if (inRange(due, thisWeek.start, thisWeek.end)) {
          openDue.thisWeek++;
          const p = String(t.Priority || '').toUpperCase();
          if (p === 'P0') openDue.p0++;
          else if (p === 'P1') openDue.p1++;
          else openDue.p2plus++;
          if (due < todayStr) openDue.overdue++;
        } else if (inRange(due, lastWeek.start, lastWeek.end)) {
          openDue.lastWeek++;
        }
      });
    };

    if (linearConfigured()) {
      try {
        const [done, open] = await Promise.all([
          listIssues({ completed: true, first: 100 }),
          listIssues({ completed: false, first: 200 }),
        ]);
        tally([...done, ...open]);
      } catch (e) {
        console.error('kpi linear', e);
        tally(backlog);
      }
    } else {
      tally(backlog);
    }

    // 4. Events scheduled this week + the next upcoming one
    let eventsThisWeek = 0;
    let eventsLastWeek = 0;
    let nextEvent = null;
    calendar.forEach((e) => {
      const d = e.date;
      if (inRange(d, thisWeek.start, thisWeek.end)) eventsThisWeek++;
      else if (inRange(d, lastWeek.start, lastWeek.end)) eventsLastWeek++;
      if (d && d >= todayStr && (!nextEvent || d < nextEvent.date)) {
        nextEvent = { title: e.title, date: d };
      }
    });

    return NextResponse.json({
      miles: { thisWeek: Math.round(milesThisWeek * 10) / 10, lastWeek: Math.round(milesLastWeek * 10) / 10, goal: 6, source },
      tasksCompleted: { thisWeek: completedThisWeek, lastWeek: completedLastWeek },
      openTasksDue: openDue,
      events: { thisWeek: eventsThisWeek, lastWeek: eventsLastWeek, next: nextEvent },
    });
  } catch (error) {
    console.error('Error fetching KPIs:', error);
    return NextResponse.json({ error: 'Failed to fetch KPIs' }, { status: 500 });
  }
}
